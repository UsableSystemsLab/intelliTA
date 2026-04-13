import express from "express";
import GitHubController from "../controllers/GitHubController.js";

const router = express.Router();

// These routes are browser redirects (no API key needed)
router.get("/auth", GitHubController.initiateAuth);
router.get("/student-auth", GitHubController.initiateStudentAuth);
router.get("/callback", GitHubController.handleCallback);

export default router;
