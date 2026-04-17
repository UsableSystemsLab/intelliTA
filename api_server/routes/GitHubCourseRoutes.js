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

// GET /api/courses/:courseId/github/classrooms — list instructor's GitHub Classrooms
router.get("/classrooms", GitHubController.listClassrooms);

// PATCH /api/courses/:courseId/github/classroom — save selected classroom
router.patch("/classroom", GitHubController.saveClassroom);

// GET /api/courses/:courseId/github/assignments — list classroom assignments
router.get("/assignments", GitHubController.listAssignments);

export default router;
