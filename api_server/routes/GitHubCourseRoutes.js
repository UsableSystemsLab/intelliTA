import express from "express";
import GitHubController from "../controllers/GitHubController.js";

const router = express.Router({ mergeParams: true });

// POST /api/courses/:courseId/github — save OAuth credentials
router.post("/", GitHubController.saveCredentials);

// GET /api/courses/:courseId/github — get connection status
router.get("/", GitHubController.getStatus);

// DELETE /api/courses/:courseId/github — remove credentials entirely
router.delete("/", GitHubController.deleteCredentials);

// DELETE /api/courses/:courseId/github/token — disconnect (keep credentials)
router.delete("/token", GitHubController.disconnect);

export default router;
