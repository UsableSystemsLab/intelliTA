import express from "express";
import TranscriptController from "../controllers/transcriptController.js";

const router = express.Router();

router.get("/activities/:activityId", TranscriptController.getActivityTranscript);
router.get("/:transcriptId/content", TranscriptController.getTranscriptContent);
router.get("/:transcriptId/status", TranscriptController.getTranscriptStatus);
router.post("/trigger", TranscriptController.triggerTranscription);

export default router;
