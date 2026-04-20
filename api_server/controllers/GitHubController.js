import crypto from "node:crypto";
import { Op } from "sequelize";
import { Octokit } from "@octokit/rest";
import { GitHubConnection, Course, User, Enrollment, Activity } from "../models/index.js";
import { encryptApiKey, decryptApiKey } from "../utils/encryption.js";

const GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API_URL = "https://api.github.com";
const OAUTH_SCOPES = "repo read:org";

// --- Stateless CSRF helpers using HMAC ---

function createState(data) {
  const payload = JSON.stringify({ ...data, ts: Date.now() });
  const hmac = crypto
    .createHmac("sha256", process.env.ENCRYPTION_KEY)
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}.${hmac}`).toString("base64url");
}

function verifyState(state) {
  const decoded = Buffer.from(state, "base64url").toString();
  const dotIndex = decoded.lastIndexOf(".");
  const payload = decoded.slice(0, dotIndex);
  const hmac = decoded.slice(dotIndex + 1);
  const expected = crypto
    .createHmac("sha256", process.env.ENCRYPTION_KEY)
    .update(payload)
    .digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) {
    throw new Error("Invalid state parameter");
  }
  const data = JSON.parse(payload);
  if (Date.now() - data.ts > 10 * 60 * 1000) {
    throw new Error("State parameter expired");
  }
  return data;
}

/**
 * Create a GitHub repo and push files using the Git Trees API.
 * @param {string} token - Decrypted GitHub access token
 * @param {string} owner - GitHub username (used as fallback owner; actual owner may be the org)
 * @param {string} repoName - Repository name (slug)
 * @param {Array<{path: string, content: string}>} files - Files to commit
 * @param {string|null} orgName - If set, create in org instead of personal account
 * @returns {{ repoUrl: string, repoFullName: string }}
 */
export async function createActivityRepo(token, owner, repoName, files, orgName = null) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // The actual repo owner is the org (when creating in org) or the user
  const repoOwner = orgName || owner;

  const createEndpoint = orgName
    ? `${GITHUB_API_URL}/orgs/${orgName}/repos`
    : `${GITHUB_API_URL}/user/repos`;

  // 1. Create repo — if it already exists, use it as-is
  let repo;
  const createRes = await fetch(createEndpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: repoName,
      private: false,
      auto_init: true,
      is_template: !!orgName,
      description: "Starter code repository created by intelliTA",
    }),
  });

  if (createRes.ok) {
    repo = await createRes.json();
  } else if (createRes.status === 422) {
    const getRes = await fetch(`${GITHUB_API_URL}/repos/${repoOwner}/${repoName}`, { headers });
    if (!getRes.ok) {
      const err = await getRes.json().catch(() => ({}));
      throw new Error(err.message || "Repo already exists but could not be fetched");
    }
    repo = await getRes.json();
  } else {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create GitHub repo (${createRes.status})`);
  }

  const defaultBranch = repo.default_branch || "main";

  // 2. Get branch SHA — with error check
  const branchRes = await fetch(
    `${GITHUB_API_URL}/repos/${repoOwner}/${repoName}/branches/${defaultBranch}`,
    { headers }
  );
  if (!branchRes.ok) {
    const err = await branchRes.json().catch(() => ({}));
    throw new Error(`Failed to get branch "${defaultBranch}": ${err.message || branchRes.status}`);
  }
  const branchData = await branchRes.json();
  if (!branchData.commit?.commit?.tree?.sha) {
    throw new Error(`Branch "${defaultBranch}" is not ready (no commit tree). Try again.`);
  }
  const baseSha = branchData.commit.sha;
  const baseTreeSha = branchData.commit.commit.tree.sha;

  // 3. Create blobs for each file
  const treeItems = await Promise.all(
    files.map(async (file) => {
      const blobRes = await fetch(
        `${GITHUB_API_URL}/repos/${repoOwner}/${repoName}/git/blobs`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            content: Buffer.from(file.content, "utf-8").toString("base64"),
            encoding: "base64",
          }),
        }
      );
      if (!blobRes.ok) {
        const err = await blobRes.json().catch(() => ({}));
        throw new Error(`Failed to create blob for "${file.path}": ${err.message}`);
      }
      const blob = await blobRes.json();
      return { path: file.path, mode: "100644", type: "blob", sha: blob.sha };
    })
  );

  // 4. Create tree
  const treeRes = await fetch(
    `${GITHUB_API_URL}/repos/${repoOwner}/${repoName}/git/trees`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
    }
  );
  if (!treeRes.ok) {
    const err = await treeRes.json().catch(() => ({}));
    throw new Error(`Failed to create tree: ${err.message}`);
  }
  const tree = await treeRes.json();

  // 5. Create commit
  const commitRes = await fetch(
    `${GITHUB_API_URL}/repos/${repoOwner}/${repoName}/git/commits`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: "Add starter code and activity content",
        tree: tree.sha,
        parents: [baseSha],
      }),
    }
  );
  if (!commitRes.ok) {
    const err = await commitRes.json().catch(() => ({}));
    throw new Error(`Failed to create commit: ${err.message}`);
  }
  const commit = await commitRes.json();

  // 6. Update branch ref
  const refRes = await fetch(
    `${GITHUB_API_URL}/repos/${repoOwner}/${repoName}/git/refs/heads/${defaultBranch}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ sha: commit.sha }),
    }
  );
  if (!refRes.ok) {
    const err = await refRes.json().catch(() => ({}));
    throw new Error(`Failed to update ref: ${err.message}`);
  }

  return { repoUrl: repo.html_url, repoFullName: repo.full_name };
}

/**
 * GitHub Classroom REST API does NOT support creating assignments (read-only).
 * We generate a pre-filled link to GitHub Classroom's "New Assignment" page instead.
 * The instructor clicks it, the starter repo is already selected.
 *
 * @param {number} classroomId
 * @param {string|null} repoFullName - e.g. "org/repo-name"
 * @returns {string} URL to GitHub Classroom new assignment page
 */
export function buildClassroomAssignmentUrl(classroomId, repoFullName) {
  const base = `https://classroom.github.com/classrooms/${classroomId}/assignments/new`;
  if (repoFullName) {
    return `${base}?starter_code_repo=${encodeURIComponent(repoFullName)}`;
  }
  return base;
}

/**
 * Auto-detect the GitHub Classroom assignment that uses this activity's starter repo.
 * Matches assignment.starter_code_repository against the activity's github_repo_url.
 *
 * @param {string} token - Instructor GitHub token
 * @param {number} classroomId - GitHub Classroom ID
 * @param {string|null} repoUrl - Activity's github_repo_url (e.g. "https://github.com/org/repo-name")
 * @returns {number|null} Assignment ID or null if not found
 */
export async function resolveAssignmentId(token, classroomId, repoUrl) {
  if (!repoUrl) return null;

  // Extract "org/repo-name" from the full URL
  const repoFullName = repoUrl.replace("https://github.com/", "").replace(/\/$/, "");

  const octokit = new Octokit({ auth: token });
  try {
    const { data: assignments } = await octokit.request(
      "GET /classrooms/{classroom_id}/assignments",
      { classroom_id: classroomId, per_page: 100 }
    );

    const repoName = repoFullName.split("/")[1] || repoFullName;
    const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // Match by starter_code_repository
    for (const a of assignments) {
      const starterRepo = a.starter_code_repository?.full_name;
      if (starterRepo && starterRepo.toLowerCase() === repoFullName.toLowerCase()) {
        return a.id;
      }
    }

    // Fallback: match by slugifying assignment title against repo name
    for (const a of assignments) {
      if (slugify(a.title) === repoName.toLowerCase()) return a.id;
    }

    if (assignments.length === 1) return assignments[0].id;

    return null;
  } catch (err) {
    console.error(`[GitHub] resolveAssignmentId error: ${err.message}`);
    return null;
  }
}

// ── Private helpers ────────────────────────────────────────────────────────

async function _exchangeCode(clientId, clientSecret, code) {
  const res = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  return res.json();
}

async function _fetchGitHubUser(accessToken) {
  const res = await fetch(`${GITHUB_API_URL}/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  return res.json();
}

const GitHubController = {
  /**
   * Save GitHub OAuth App credentials (Client ID + Secret) for a course.
   * POST /api/courses/:courseId/github
   */
  async saveCredentials(req, res) {
    try {
      const { courseId } = req.params;
      const { github_client_id, github_client_secret } = req.body;

      if (!github_client_id || !github_client_secret) {
        return res
          .status(400)
          .json({ message: "Client ID and Client Secret are required" });
      }

      const course = await Course.findByPk(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const encryptedSecret = await encryptApiKey(github_client_secret);

      const [connection, created] = await GitHubConnection.findOrCreate({
        where: { course_id: courseId },
        defaults: {
          course_id: courseId,
          github_client_id,
          github_client_secret: encryptedSecret,
        },
      });

      if (!created) {
        connection.github_client_id = github_client_id;
        connection.github_client_secret = encryptedSecret;
        connection.github_token = null;
        connection.github_username = null;
        connection.github_org = null;
        await connection.save();
      }

      res.status(created ? 201 : 200).json({
        message: created
          ? "Credentials saved successfully"
          : "Credentials updated successfully",
        has_credentials: true,
        connected: false,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error saving credentials", error: error.message });
    }
  },

  /**
   * Initiate GitHub OAuth for a STUDENT to verify their identity.
   * Finds any GitHub-connected course the student is enrolled in and uses its OAuth App.
   * GET /api/github/student-auth?firebaseId=...&redirect=...
   */
  async initiateStudentAuth(req, res) {
    try {
      const { firebaseId, courseId, redirect } = req.query;
      if (!firebaseId || !courseId || !redirect) {
        return res.status(400).json({ message: "firebaseId, courseId and redirect are required" });
      }

      const user = await User.findOne({ where: { firebaseId } });
      if (!user) {
        return res.redirect(`${redirect}?github=error&message=User+not+found`);
      }

      const connection = await GitHubConnection.findOne({
        where: { course_id: courseId, github_client_id: { [Op.ne]: null } },
      });

      if (!connection) {
        return res.redirect(
          `${redirect}?github=error&message=GitHub+not+configured+for+this+course`
        );
      }

      const callbackUrl = `${req.protocol}://${req.get("host")}/api/github/callback`;
      const state = createState({ type: "student", userId: user.id, courseId, redirect });

      const params = new URLSearchParams({
        client_id: connection.github_client_id,
        redirect_uri: callbackUrl,
        scope: "read:user",   // minimal — we only need to identify them
        state,
      });

      res.redirect(`${GITHUB_OAUTH_URL}?${params.toString()}`);
    } catch (error) {
      const fallback = req.query.redirect || "/";
      res.redirect(`${fallback}?github=error&message=${encodeURIComponent(error.message)}`);
    }
  },

  /**
   * Initiate GitHub OAuth flow — redirects the browser to GitHub.
   * GET /api/github/auth?courseId=...&redirect=...
   */
  async initiateAuth(req, res) {
    try {
      const { courseId, redirect } = req.query;

      if (!courseId || !redirect) {
        return res
          .status(400)
          .json({ message: "courseId and redirect are required" });
      }

      const connection = await GitHubConnection.findOne({
        where: { course_id: courseId },
      });
      if (!connection) {
        return res
          .status(404)
          .json({ message: "No GitHub credentials found for this course" });
      }

      const callbackUrl = `${req.protocol}://${req.get("host")}/api/github/callback`;
      const state = createState({ courseId, redirect });

      const params = new URLSearchParams({
        client_id: connection.github_client_id,
        redirect_uri: callbackUrl,
        scope: OAUTH_SCOPES,
        state,
      });

      res.redirect(`${GITHUB_OAUTH_URL}?${params.toString()}`);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error initiating auth", error: error.message });
    }
  },

  /**
   * Handle GitHub OAuth callback — exchanges code for token, saves it.
   * GET /api/github/callback?code=...&state=...
   */
  async handleCallback(req, res) {
    let redirectUrl;
    try {
      const { code, state } = req.query;
      const stateData = verifyState(state);
      redirectUrl = stateData.redirect;

      // ── Student identity verification ──────────────────────────────────────
      if (stateData.type === "student") {
        const { userId, courseId: stateCourseId, redirect } = stateData;

        const connection = await GitHubConnection.findOne({
          where: { course_id: stateCourseId, github_client_id: { [Op.ne]: null } },
        });

        if (!connection) {
          return res.redirect(`${redirect}?github=error&message=Connection+lost`);
        }

        const clientSecret = await decryptApiKey(connection.github_client_secret);
        const tokenData = await _exchangeCode(connection.github_client_id, clientSecret, code);
        if (tokenData.error) {
          return res.redirect(`${redirect}?github=error&message=${encodeURIComponent(tokenData.error_description || tokenData.error)}`);
        }

        const ghUser = await _fetchGitHubUser(tokenData.access_token);

        // Save verified username — token is NOT stored (we only needed it to identify the user)
        await User.update(
          { github_username: ghUser.login, github_verified: true },
          { where: { id: userId } }
        );

        return res.redirect(`${redirect}?github=verified&username=${encodeURIComponent(ghUser.login)}`);
      }

      // ── Instructor OAuth (existing flow) ───────────────────────────────────
      const { courseId, redirect } = stateData;

      const connection = await GitHubConnection.findOne({ where: { course_id: courseId } });
      if (!connection) {
        return res.redirect(`${redirect}?github=error&message=No+credentials+found`);
      }

      const clientSecret = await decryptApiKey(connection.github_client_secret);
      const tokenData = await _exchangeCode(connection.github_client_id, clientSecret, code);
      if (tokenData.error) {
        return res.redirect(`${redirect}?github=error&message=${encodeURIComponent(tokenData.error_description || tokenData.error)}`);
      }

      const ghUser = await _fetchGitHubUser(tokenData.access_token);
      const encryptedToken = await encryptApiKey(tokenData.access_token);

      connection.github_token = encryptedToken;
      connection.github_username = ghUser.login;
      connection.github_org = null;
      await connection.save();

      res.redirect(`${redirect}?github=connected`);
    } catch (error) {
      const fallback = redirectUrl || "/";
      res.redirect(`${fallback}?github=error&message=${encodeURIComponent(error.message)}`);
    }
  },

  /**
   * Get GitHub connection status for a course.
   * GET /api/courses/:courseId/github
   */
  async getStatus(req, res) {
    try {
      const { courseId } = req.params;

      const connection = await GitHubConnection.findOne({
        where: { course_id: courseId },
        attributes: [
          "github_client_id",
          "github_username",
          "github_org",
          "github_token",
          "github_classroom_id",
          "github_classroom_name",
        ],
      });

      if (!connection) {
        return res.status(200).json({
          has_credentials: false,
          connected: false,
        });
      }

      res.status(200).json({
        has_credentials: true,
        connected: !!connection.github_token,
        github_username: connection.github_username || null,
        github_org: connection.github_org || null,
        github_client_id: connection.github_client_id,
        github_classroom_id: connection.github_classroom_id || null,
        github_classroom_name: connection.github_classroom_name || null,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching status", error: error.message });
    }
  },

  /**
   * Disconnect GitHub (remove token, keep credentials).
   * DELETE /api/courses/:courseId/github/token
   */
  async disconnect(req, res) {
    try {
      const { courseId } = req.params;

      const connection = await GitHubConnection.findOne({
        where: { course_id: courseId },
      });
      if (!connection) {
        return res.status(404).json({ message: "No GitHub connection found" });
      }

      connection.github_token = null;
      connection.github_username = null;
      connection.github_org = null;
      await connection.save();

      res.status(200).json({ message: "GitHub disconnected successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error disconnecting", error: error.message });
    }
  },

  /**
   * List GitHub Classrooms the connected user is an instructor of.
   * GET /api/courses/:courseId/github/classrooms
   */
  async listClassrooms(req, res) {
    try {
      const { courseId } = req.params;
      const connection = await GitHubConnection.findOne({ where: { course_id: courseId } });
      if (!connection || !connection.github_token) {
        return res.status(400).json({ message: "GitHub not connected for this course" });
      }

      const token = await decryptApiKey(connection.github_token);

      const classRes = await fetch(`${GITHUB_API_URL}/classrooms`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      if (!classRes.ok) {
        const err = await classRes.json().catch(() => ({}));
        return res.status(classRes.status).json({ message: err.message || "Failed to fetch classrooms" });
      }

      const classrooms = await classRes.json();
      res.json(classrooms.map(c => ({
        id: c.id,
        name: c.name,
        url: c.url,
        organization: c.organization?.login || null,
      })));
    } catch (error) {
      res.status(500).json({ message: "Error listing classrooms", error: error.message });
    }
  },

  /**
   * Save the selected GitHub Classroom for a course.
   * PATCH /api/courses/:courseId/github/classroom
   */
  async saveClassroom(req, res) {
    try {
      const { courseId } = req.params;
      const { classroom_id, classroom_name, classroom_org } = req.body;

      if (!classroom_id) {
        return res.status(400).json({ message: "classroom_id is required" });
      }

      const connection = await GitHubConnection.findOne({ where: { course_id: courseId } });
      if (!connection) {
        return res.status(404).json({ message: "No GitHub connection found for this course" });
      }

      connection.github_classroom_id = classroom_id;
      connection.github_classroom_name = classroom_name || null;
      // Always update org, even if null (saves whatever the classroom reports)
      connection.github_org = classroom_org || null;
      await connection.save();

      res.json({
        message: "Classroom saved successfully",
        github_classroom_id: connection.github_classroom_id,
        github_classroom_name: connection.github_classroom_name,
        github_org: connection.github_org,
      });
    } catch (error) {
      res.status(500).json({ message: "Error saving classroom", error: error.message });
    }
  },

  /**
   * List assignments for the linked GitHub Classroom.
   * GET /api/courses/:courseId/github/assignments
   */
  async listAssignments(req, res) {
    try {
      const { courseId } = req.params;
      const connection = await GitHubConnection.findOne({ where: { course_id: courseId } });
      if (!connection || !connection.github_token) {
        return res.status(400).json({ message: "GitHub not connected for this course" });
      }
      if (!connection.github_classroom_id) {
        return res.status(400).json({ message: "No classroom linked to this course" });
      }

      const token = await decryptApiKey(connection.github_token);
      const octokit = new Octokit({ auth: token });

      const { data } = await octokit.request(
        "GET /classrooms/{classroom_id}/assignments",
        { classroom_id: connection.github_classroom_id }
      );

      res.json(data.map(a => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        type: a.type,
        invite_link: a.invite_link,
        accepted: a.accepted,
        submissions: a.submissions,
        starter_code_repository: a.starter_code_repository?.full_name || null,
      })));
    } catch (error) {
      console.error("[GitHub Assignments]", error.message);
      res.status(500).json({ message: "Error listing assignments", error: error.message });
    }
  },

  /**
   * Link a GitHub Classroom assignment to an activity.
   * PATCH /api/courses/:courseId/activities/:activityId/github-assignment
   */
  async linkAssignment(req, res) {
    try {
      const { activityId } = req.params;
      const { assignment_id } = req.body;

      if (!assignment_id) {
        return res.status(400).json({ message: "assignment_id is required" });
      }

      const activity = await Activity.findOne({ where: { activity_id: activityId } });
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }

      activity.github_assignment_id = assignment_id;
      await activity.save();

      res.json({ message: "Assignment linked", github_assignment_id: assignment_id });
    } catch (error) {
      res.status(500).json({ message: "Error linking assignment", error: error.message });
    }
  },

  /**
   * Get acceptance status for an activity's GitHub Classroom assignment.
   * Cross-references accepted assignments with enrolled students.
   * GET /api/courses/:courseId/activities/:activityId/github-acceptances
   */
  async getAcceptances(req, res) {
    try {
      const { courseId, activityId } = req.params;

      const activity = await Activity.findOne({ where: { activity_id: activityId } });
      if (!activity) return res.status(404).json({ message: "Activity not found" });

      const connection = await GitHubConnection.findOne({ where: { course_id: courseId } });
      if (!connection?.github_token) {
        return res.status(400).json({ message: "GitHub not connected for this course" });
      }

      const token = await decryptApiKey(connection.github_token);

      // Resolve assignment if not linked
      let assignmentId = activity.github_assignment_id;
      if (!assignmentId && connection.github_classroom_id) {
        assignmentId = await resolveAssignmentId(
          token, connection.github_classroom_id, activity.github_repo_url
        );
        if (assignmentId) {
          await activity.update({ github_assignment_id: assignmentId });
        }
      }

      if (!assignmentId) {
        return res.status(400).json({ message: "No GitHub Classroom assignment linked to this activity" });
      }

      // Fetch accepted assignments from GitHub Classroom
      const octokit = new Octokit({ auth: token });
      const { data: accepted } = await octokit.request(
        "GET /assignments/{assignment_id}/accepted_assignments",
        { assignment_id: assignmentId, per_page: 100 }
      );

      // Build a map: github_username → acceptance data
      const acceptanceMap = {};
      for (const a of accepted) {
        for (const s of a.students) {
          acceptanceMap[s.login.toLowerCase()] = {
            repo_url: a.repository?.html_url || null,
            commit_count: a.commit_count || 0,
            submitted: a.submitted || false,
            grade: a.grade || null,
          };
        }
      }

      // Fetch enrolled students
      const enrollments = await Enrollment.findAll({
        where: { course_id: courseId, status: "active" },
        include: [{ model: User, as: "user", attributes: ["id", "fName", "lName", "email", "github_username", "github_verified"] }],
      });

      const students = enrollments.map(e => {
        const ghUser = e.user.github_username?.toLowerCase();
        const acceptance = ghUser ? acceptanceMap[ghUser] || null : null;

        return {
          user_id: e.user.id,
          name: `${e.user.fName} ${e.user.lName}`,
          email: e.user.email,
          github_username: e.user.github_username || null,
          github_verified: e.user.github_verified,
          accepted: !!acceptance,
          repo_url: acceptance?.repo_url || null,
          commit_count: acceptance?.commit_count || 0,
          submitted: acceptance?.submitted || false,
          grade: acceptance?.grade || null,
        };
      });

      // Sort: accepted first, then by name
      students.sort((a, b) => {
        if (a.accepted !== b.accepted) return a.accepted ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      const acceptedCount = students.filter(s => s.accepted).length;

      res.json({
        assignment_id: assignmentId,
        total_enrolled: students.length,
        accepted_count: acceptedCount,
        students,
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching acceptances", error: error.message });
    }
  },

  /**
   * Push student code to their GitHub Classroom assignment repo.
   * Called internally from submitActivity — not exposed as a route.
   *
   * @param {string} instructorToken - Decrypted instructor GitHub token
   * @param {number} assignmentId - GitHub Classroom assignment ID
   * @param {string} studentGithubUsername - Student's verified GitHub username
   * @param {Array<{name: string, content: string}>} files - Code files from the web editor
   * @returns {{ commitUrl: string, repoUrl: string }}
   */
  async pushStudentCode(instructorToken, assignmentId, studentGithubUsername, files) {
    const octokit = new Octokit({ auth: instructorToken });

    // 1. Find the student's accepted assignment repo
    const { data: accepted } = await octokit.request(
      "GET /assignments/{assignment_id}/accepted_assignments",
      { assignment_id: assignmentId, per_page: 100 }
    );

    const studentAssignment = accepted.find(a =>
      a.students.some(s => s.login.toLowerCase() === studentGithubUsername.toLowerCase())
    );

    if (!studentAssignment) {
      throw new Error(
        `No accepted assignment found for GitHub user "${studentGithubUsername}". ` +
        `Make sure the student has accepted the assignment on GitHub Classroom.`
      );
    }

    const repoFullName = studentAssignment.repository.full_name;
    const [owner, repo] = repoFullName.split("/");

    // 2. Get default branch SHA
    const { data: refData } = await octokit.rest.git.getRef({
      owner, repo, ref: "heads/main",
    }).catch(() =>
      octokit.rest.git.getRef({ owner, repo, ref: "heads/master" })
    );
    const baseSha = refData.object.sha;

    // 3. Get the current commit's tree
    const { data: commitData } = await octokit.rest.git.getCommit({
      owner, repo, commit_sha: baseSha,
    });
    const baseTreeSha = commitData.tree.sha;

    // 4. Create blobs for each file
    const treeItems = await Promise.all(
      files.map(async (file) => {
        const { data: blob } = await octokit.rest.git.createBlob({
          owner, repo,
          content: Buffer.from(file.content, "utf-8").toString("base64"),
          encoding: "base64",
        });
        return { path: file.name, mode: "100644", type: "blob", sha: blob.sha };
      })
    );

    // 5. Create new tree
    const { data: tree } = await octokit.rest.git.createTree({
      owner, repo,
      base_tree: baseTreeSha,
      tree: treeItems,
    });

    // 6. Create commit
    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner, repo,
      message: `Submit solution via intelliTA`,
      tree: tree.sha,
      parents: [baseSha],
    });

    // 7. Update branch ref
    const branch = refData.ref.replace("refs/", "");
    await octokit.rest.git.updateRef({
      owner, repo,
      ref: branch,
      sha: newCommit.sha,
    });

    return {
      commitUrl: `https://github.com/${repoFullName}/commit/${newCommit.sha}`,
      repoUrl: `https://github.com/${repoFullName}`,
    };
  },

  /**
   * Delete GitHub credentials entirely for a course.
   * DELETE /api/courses/:courseId/github
   */
  async deleteCredentials(req, res) {
    try {
      const { courseId } = req.params;

      const deleted = await GitHubConnection.destroy({
        where: { course_id: courseId },
      });

      if (!deleted) {
        return res.status(404).json({ message: "No GitHub connection found" });
      }

      res.status(204).send();
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting credentials", error: error.message });
    }
  },
};

export default GitHubController;
