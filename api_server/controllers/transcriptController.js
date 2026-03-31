import { VideoTranscript } from "../models/index.js";
import transcriptionService from "../services/transcriptionService.js";
import { s3, S3_BUCKET } from "../configs/s3.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const TranscriptController = {
  // Get transcript metadata for an activity
  async getActivityTranscript(req, res) {
    try {
      const { activityId } = req.params;
      const transcript = await VideoTranscript.findOne({
        where: { activity_id: activityId },
      });
      if (!transcript) {
        return res.status(404).json({ message: "Transcript not found" });
      }
      res.json(transcript);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transcript", error: error.message });
    }
  },

  // Get full transcript content from S3
  async getTranscriptContent(req, res) {
    try {
      const { transcriptId } = req.params;
      const transcript = await VideoTranscript.findByPk(transcriptId);

      if (!transcript) {
        return res.status(404).json({ message: "Transcript not found" });
      }
      if (transcript.status !== "completed") {
        return res.status(400).json({ message: "Transcript not ready", status: transcript.status });
      }

      // Fetch from S3
      const url = new URL(transcript.transcript_url);
      const key = url.pathname.replace(`/${S3_BUCKET}/`, "");
      const response = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));
      const content = await response.Body.transformToString();

      res.json(JSON.parse(content));
    } catch (error) {
      res.status(500).json({ message: "Error fetching content", error: error.message });
    }
  },

  // Get transcript status
  async getTranscriptStatus(req, res) {
    try {
      const { transcriptId } = req.params;
      const transcript = await VideoTranscript.findByPk(transcriptId, {
        attributes: ["transcript_id", "status", "error_message", "created_at", "started_at", "completed_at"],
      });
      if (!transcript) {
        return res.status(404).json({ message: "Transcript not found" });
      }
      res.json(transcript);
    } catch (error) {
      res.status(500).json({ message: "Error fetching status", error: error.message });
    }
  },

  // Manually trigger transcription
  async triggerTranscription(req, res) {
    try {
      const { activityId, videoUrl } = req.body || {};
      if (!activityId || !videoUrl) {
        return res.status(400).json({ message: "activityId and videoUrl are required" });
      }
      const record = await transcriptionService.queueTranscription(activityId, videoUrl);
      res.status(202).json({ message: "Transcription queued", transcript: record });
    } catch (error) {
      res.status(500).json({ message: "Error triggering transcription", error: error.message });
    }
  },
};

export default TranscriptController;
