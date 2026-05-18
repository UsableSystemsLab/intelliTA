import Activity from "../models/Activity.js";
import Submission from "../models/Submission.js";
import User from "../models/User.js";
import transcriptionService from "../services/transcriptionService.js";
import { GitHubConnection, Enrollment, ActivityTestCase, SubmissionTestResult } from "../models/index.js";
import { decryptApiKey } from "../utils/encryption.js";
import { createActivityRepo, resolveAssignmentId } from "./GitHubController.js";
import GitHubController from "./GitHubController.js";
import { sequelize } from "../configs/postgresDB.js";
import { setCodeTestCases } from "../services/activityTestCaseService.js";
import rewardPipeline from "../services/rewardPipeline.js";

/**
 * Push activity files to a GitHub repo and create a Classroom assignment.
 * Raw file content is passed directly from memory (no S3 re-fetch needed).
 * Runs asynchronously after the activity is already saved.
 *
 * @param {object} activity  - Saved Activity instance
 * @param {string} courseId
 * @param {string} title     - Activity title
 * @param {string|null} mdContent          - Raw markdown string
 * @param {string|null} starterCodeContent - Raw JSON string of [{name, content}]
 */
async function _createGitHubRepo(activity, courseId, title, mdContent, starterCodeContent, testsManifest) {
  const connection = await GitHubConnection.findOne({ where: { course_id: courseId } });
  if (!connection || !connection.github_token) {
    console.log(`[GitHub] No connected token for course ${courseId} — skipping`);
    return;
  }

  const token = await decryptApiKey(connection.github_token);
  const owner = connection.github_username;
  let orgName = connection.github_org || null;
  const updates = {};

  // If classroom is linked but org wasn't saved, resolve it from GitHub
  if (!orgName && connection.github_classroom_id) {
    try {
      const classRes = await fetch(
        `https://api.github.com/classrooms/${connection.github_classroom_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );
      if (classRes.ok) {
        const classData = await classRes.json();
        orgName = classData.organization?.login || null;
        if (orgName) {
          connection.github_org = orgName;
          await connection.save();
        }
      }
    } catch (err) {
      console.warn(`[GitHub] Could not resolve org from classroom: ${err.message}`);
    }
  }

  const files = [];
  if (mdContent) {
    files.push({ path: "README.md", content: mdContent });
  }
  if (starterCodeContent) {
    try {
      const starterFiles = JSON.parse(starterCodeContent);
      for (const f of starterFiles) {
        if (f.name && f.content != null) {
          files.push({ path: f.name, content: String(f.content) });
        }
      }
    } catch (err) {
      console.warn(`[GitHub] Could not parse starter code JSON: ${err.message}`);
    }
  }
  // Test files travel into the assignment repo so the GH Classroom autograder
  // runs the same bytes Piston runs at hint time. Manifest paths are kept as-is
  // (test_main.py, MainTest.java, etc.) — students see them as visible tests.
  if (testsManifest && Array.isArray(testsManifest.test_files)) {
    for (const tf of testsManifest.test_files) {
      if (tf.path && tf.content != null) {
        files.push({ path: tf.path, content: String(tf.content) });
      }
    }
  }

  let repoFullName = null;
  if (files.length > 0) {
    const repoName = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 100);
    try {
      const result = await createActivityRepo(token, owner, repoName, files, orgName);
      updates.github_repo_url = result.repoUrl;
      repoFullName = orgName ? result.repoFullName : null;
    } catch (err) {
      console.error(`[GitHub] Repo creation failed: ${err.message}`);
    }
  }


  if (Object.keys(updates).length > 0) {
    await activity.update(updates);
  }
}

function escapeMarkdownCell(s) {
  return String(s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function renderSubmissionMarkdown(grade) {
  const rows = grade.checkpoints.length === 0
    ? "| — | — | — | — |"
    : grade.checkpoints.map((c, i) =>
        `| ${i + 1} | ${escapeMarkdownCell(c.title)} | ${c.type} | ${c.passed ? "Pass" : "Fail"} |`
      ).join("\n");

  return `# intelliTA Submission

**Activity:** ${escapeMarkdownCell(grade.activity_title)}
**Score:** ${grade.score} / ${grade.max_score}
**Submitted:** ${grade.submitted_at}

## Checkpoints

| # | Title | Type | Result |
|---|-------|------|--------|
${rows}
`;
}

function buildGradeArtifacts(activity, score, checkpoints) {
  const submittedAt = new Date().toISOString();
  // ':' is invalid in Windows paths and ugly in URLs; use a filesystem-safe form.
  const safeTs = submittedAt.replace(/:/g, "-");

  const grade = {
    activity_id: activity.activity_id,
    activity_title: activity.title || "",
    score: typeof score === "number" ? score : Number(score) || 0,
    max_score: 100,
    submitted_at: submittedAt,
    checkpoints: Array.isArray(checkpoints)
      ? checkpoints.map(c => ({
          id: c.id,
          title: c.title || "",
          type: c.type,
          passed: !!c.passed,
        }))
      : [],
  };

  const json = JSON.stringify(grade, null, 2);
  const md = renderSubmissionMarkdown(grade);

  return {
    files: [
      { name: "intellita/grade.json",                 content: json },
      { name: "intellita/SUBMISSION.md",              content: md },
      { name: `intellita/submissions/${safeTs}.json`, content: json },
    ],
    readmeSection: md,
  };
}

const ActivityController = {
  async getActivityById(req, res) {
    try {
      const { activityId } = req.params;
      if (!activityId) {
        return res.status(400).json({ message: "Activity ID is required" });
      }

      const activity = await Activity.findOne({
        where: { activity_id: activityId }
      });

      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }

      res.json(activity);
    } catch (error) {
      console.error("Get Activity Error:", error);
      res.status(500).json({ message: "Failed to fetch activity", error: error.message });
    }
  },

  async createActivity(req, res) {
    try {
      const { courseId } = req.params;

      if (!courseId) {
        return res.status(400).json({ message: "Course ID is missing. Ensure the route is configured with mergeParams." });
      }

      const { title, start_date, end_date, video_url } = req.body;
      const md_file_url = req.body.md_file_url;
      const starter_code_url = req.body.starter_code_url;
      const quiz_url = req.body.quiz_url;
      const github_classroom_url = req.body.github_classroom_url;
      const tests_url = req.body.tests_url;
      const tests_language = req.body.tests_language;

      // Basic validation
      if (!title || !start_date || !end_date) {
        return res.status(400).json({ message: "Title, Start Date, and End Date are required" });
      }

      const newActivity = await Activity.create({
        course_id: courseId,
        title,
        start_date,
        end_date,
        video_url: video_url || null,
        md_file_url: md_file_url || null,
        starter_code_url: starter_code_url || null,
        quiz_url: quiz_url || null,
        github_classroom_url: github_classroom_url || null,
        tests_url: tests_url || null,
        tests_language: tests_language || null,
      });

      // Queue transcription if video was uploaded
      if (newActivity.video_url) {
        transcriptionService.queueTranscription(newActivity.activity_id, newActivity.video_url)
          .catch(err => console.error("Failed to queue transcription:", err.message));
      }

      // Create GitHub repo only if instructor opted in
      if (req.body.create_github_repo === "true") {
        const mdContent = req.body._md_content || null;
        const starterCodeContent = req.body._starter_code_content || null;
        const testsManifest = req.body._tests_manifest_parsed || null;
        _createGitHubRepo(newActivity, courseId, title, mdContent, starterCodeContent, testsManifest).catch(err =>
          console.error("[GitHub] Repo creation failed:", err.message)
        );
      }

      res.status(201).json(newActivity);
    } catch (error) {
      console.error("Create Activity Error:", error);
      res.status(500).json({ message: "Failed to create activity", error: error.message });
    }
  },

  async getActivitiesByCourse(req, res) {
    try {
      const { courseId } = req.params;
      const activities = await Activity.findAll({
        where: { course_id: courseId },
        order: [['start_date', 'ASC']]
      });
      res.json(activities);
    } catch (error) {
      console.error("Get Activities Error:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  },

  async updateActivity(req, res) {
    try {
      const { activityId } = req.params;
      const { title, start_date, end_date, video_url, md_file_url, starter_code_url, quiz_url, github_classroom_url, tests_url, tests_language } = req.body;

      const activity = await Activity.findOne({
        where: { activity_id: activityId }
      });

      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }

      // Detect changes to fields that affect student progress (checkpoints/code/tests).
      const contentChanged =
        (video_url !== undefined && video_url !== activity.video_url) ||
        (quiz_url !== undefined && quiz_url !== activity.quiz_url) ||
        (starter_code_url !== undefined && starter_code_url !== activity.starter_code_url) ||
        (tests_url !== undefined && tests_url !== activity.tests_url);

      // Update only provided fields
      if (title !== undefined) activity.title = title;
      if (start_date !== undefined) activity.start_date = start_date;
      if (end_date !== undefined) activity.end_date = end_date;
      if (video_url !== undefined) activity.video_url = video_url;
      if (md_file_url !== undefined) activity.md_file_url = md_file_url;
      if (starter_code_url !== undefined) activity.starter_code_url = starter_code_url;
      if (quiz_url !== undefined) activity.quiz_url = quiz_url;
      if (github_classroom_url !== undefined) activity.github_classroom_url = github_classroom_url;
      if (tests_url !== undefined) activity.tests_url = tests_url;
      if (tests_language !== undefined) activity.tests_language = tests_language;

      if (contentChanged) activity.content_updated_at = new Date();

      await activity.save();

      res.json(activity);
    } catch (error) {
      console.error("Update Activity Error:", error);
      res.status(500).json({ message: "Failed to update activity", error: error.message });
    }
  },

  async deleteActivity(req, res) {
    try {
      const { activityId } = req.params;
      const result = await Activity.destroy({
        where: { activity_id: activityId }
      });

      if (result === 0) {
        return res.status(404).json({ message: "Activity not found" });
      }

      res.status(200).json({ message: "Activity deleted successfully" });
    } catch (error) {
      console.error("Delete Activity Error:", error);
      res.status(500).json({ message: "Failed to delete activity" });
    }
  },

  async submitActivity(req, res) {
    try {
      const { activityId, courseId } = req.params;
      const { userId, firebaseId, score, files, checkpoints } = req.body;

      if (!activityId) return res.status(400).json({ message: "Activity ID is required" });
      if (!userId && !firebaseId) return res.status(400).json({ message: "User ID or Firebase ID is required" });

      // Find the user first
      let user;
      if (userId) {
        user = await User.findByPk(userId);
      } else if (firebaseId) {
        user = await User.findOne({ where: { firebaseId: firebaseId } });
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if submission exists
      let submission = await Submission.findOne({
        where: {
          activity_id: activityId,
          user_id: user.id
        }
      });

      let rewards = null;
      if (submission) {
        submission.score = score || submission.score;
        await submission.save();
      } else {
        const finalScore = score == null ? 100 : score;
        const status = finalScore > 0 ? "PASSED" : "FAILED";
        const localHour = req.body.local_hour;

        const result = await sequelize.transaction(async (txn) => {
          const priorAttempts = await Submission.count({
            where: { activity_id: activityId, user_id: user.id },
            transaction: txn,
          });

          const created = await Submission.create(
            {
              activity_id: activityId,
              user_id: user.id,
              score: finalScore,
              started_at: new Date(),
              status,
              active_seconds: 0,
              hints_used: 0,
              attempt_number: priorAttempts + 1,
            },
            { transaction: txn }
          );

          // Seed submission_test_results from activity_test_cases so the reward
          // pipeline has something to grade. The legacy endpoint doesn't know
          // which tests passed individually, so we mirror the overall status.
          const testCases = await ActivityTestCase.findAll({
            where: { activity_id: activityId },
            transaction: txn,
          });

          if (testCases.length) {
            const priorPassed = await SubmissionTestResult.findAll({
              attributes: ["test_case_id"],
              where: { passed: true },
              include: [{
                model: Submission,
                as: "submission",
                attributes: [],
                where: {
                  user_id: user.id,
                  activity_id: activityId,
                  submission_id: { [sequelize.Sequelize.Op.ne]: created.submission_id },
                },
                required: true,
              }],
              transaction: txn,
            });
            const priorPassedIds = new Set(priorPassed.map((r) => r.test_case_id));
            const passed = status === "PASSED";

            await SubmissionTestResult.bulkCreate(
              testCases.map((tc) => ({
                submission_id: created.submission_id,
                test_case_id: tc.test_case_id,
                passed,
                points_awarded: passed && !priorPassedIds.has(tc.test_case_id) ? tc.points : 0,
              })),
              { transaction: txn }
            );
          }

          const r = await rewardPipeline.process({
            submissionId: created.submission_id,
            localHour,
            txn,
          });

          return { created, rewards: r };
        });

        submission = result.created;
        rewards = result.rewards;
      }

      // --- Push code to student's GitHub Classroom repo ---
      let githubResult = null;
      if (files && files.length > 0) {
        try {
          const activity = await Activity.findOne({ where: { activity_id: activityId } });
          if (!user.github_username || !user.github_verified) {
            console.warn(`[GitHub Push] Skipped: user ${user.id} has no verified GitHub link (github_username=${user.github_username ?? "null"}, github_verified=${user.github_verified ?? false})`);
          } else {
            const cId = courseId || activity.course_id;
            const connection = await GitHubConnection.findOne({ where: { course_id: cId } });
            if (!connection?.github_token) {
              console.warn(`[GitHub Push] Skipped: course ${cId} has no GitHubConnection token`);
            } else {
              const token = await decryptApiKey(connection.github_token);

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
                console.warn(`[GitHub Push] Skipped: activity ${activityId} has no resolvable Classroom assignment (classroom_id=${connection.github_classroom_id ?? "null"}, repo_url=${activity.github_repo_url ?? "null"})`);
              } else {
                console.log(`[GitHub Push] Pushing for user=${user.github_username} assignment=${assignmentId}`);
                const { files: artifactFiles, readmeSection } = buildGradeArtifacts(activity, score ?? submission.score, checkpoints);
                githubResult = await GitHubController.pushStudentCode(
                  token, assignmentId, user.github_username,
                  [...files, ...artifactFiles],
                  { gradeReadmeSection: readmeSection },
                );
                console.log(`[GitHub Push] Success: ${githubResult.commitUrl}`);
              }
            }
          }
        } catch (ghErr) {
          console.error("[GitHub Push] Failed:", ghErr.message);
          // Don't fail the submission — just log the error
          githubResult = { error: ghErr.message };
        }
      } else {
        console.warn("[GitHub Push] Skipped: no files in request body");
      }

      const response = {
        message: submission.isNewRecord === false ? "Submission updated" : "Activity submitted successfully",
        submission,
      };
      if (githubResult) {
        response.github = githubResult;
      }
      if (rewards) {
        response.rewards = rewards;
      }

      return res.status(submission.isNewRecord === false ? 200 : 201).json(response);

    } catch (error) {
      console.error("Submit Activity Error:", error);
      res.status(500).json({ message: "Failed to submit activity", error: error.message });
    }
  },

  async setCodeTests(req, res) {
    try {
      const { activityId } = req.params;
      const { test_names } = req.body || {};
      if (!Array.isArray(test_names)) {
        return res.status(400).json({ message: "test_names must be an array" });
      }
      const activity = await Activity.findOne({ where: { activity_id: activityId } });
      if (!activity) return res.status(404).json({ message: "Activity not found" });

      await sequelize.transaction(async (txn) => {
        await setCodeTestCases(activityId, test_names, { txn });
      });

      const rows = await ActivityTestCase.findAll({
        where: { activity_id: activityId },
        order: [["kind", "ASC"], ["position", "ASC"]],
      });
      return res.json({
        test_cases: rows.map((r) => ({
          test_case_id: r.test_case_id,
          kind: r.kind,
          external_ref: r.external_ref,
          points: r.points,
          position: r.position,
        })),
      });
    } catch (error) {
      console.error("setCodeTests error:", error);
      return res.status(500).json({ message: "Failed to update code tests", error: error.message });
    }
  },
};

export default ActivityController;
