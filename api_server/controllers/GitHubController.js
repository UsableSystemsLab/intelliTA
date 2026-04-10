import crypto from "node:crypto";
import { GitHubConnection, Course } from "../models/index.js";
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
      const { courseId, redirect } = stateData;
      redirectUrl = redirect;

      const connection = await GitHubConnection.findOne({
        where: { course_id: courseId },
      });
      if (!connection) {
        return res.redirect(
          `${redirect}?github=error&message=No+credentials+found`,
        );
      }

      const clientSecret = await decryptApiKey(connection.github_client_secret);

      // Exchange code for access token
      const tokenRes = await fetch(GITHUB_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: connection.github_client_id,
          client_secret: clientSecret,
          code,
        }),
      });

      const tokenData = await tokenRes.json();
      if (tokenData.error) {
        return res.redirect(
          `${redirect}?github=error&message=${encodeURIComponent(tokenData.error_description || tokenData.error)}`,
        );
      }

      // Fetch GitHub user info
      const userRes = await fetch(`${GITHUB_API_URL}/user`, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.github+json",
        },
      });
      const userData = await userRes.json();

      // Encrypt and save token
      const encryptedToken = await encryptApiKey(tokenData.access_token);

      connection.github_token = encryptedToken;
      connection.github_username = userData.login;
      connection.github_org = null; // will be set when instructor picks a classroom
      await connection.save();

      res.redirect(`${redirect}?github=connected`);
    } catch (error) {
      const fallback = redirectUrl || "/";
      res.redirect(
        `${fallback}?github=error&message=${encodeURIComponent(error.message)}`,
      );
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
