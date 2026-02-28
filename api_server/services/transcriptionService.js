import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import groq from "../configs/groq.js";
import { s3, S3_BUCKET, S3_PUBLIC_URL } from "../configs/s3.js";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { VideoTranscript } from "../models/index.js";

class TranscriptionService {
  /**
   * Download video from S3
   * @param {string} videoUrl - Public URL of the video
   * @returns {Promise<Buffer>} - Video file buffer
   */
  async downloadVideo(videoUrl) {
    const url = new URL(videoUrl);
    // Extract key from URL path (remove leading slash and bucket name)
    const pathParts = url.pathname.split("/").filter(Boolean);
    // Remove bucket name if present in path
    const key = pathParts[0] === S3_BUCKET
      ? pathParts.slice(1).join("/")
      : pathParts.join("/");

    const response = await s3.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      })
    );

    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  /**
   * Extract audio from video using ffmpeg
   * @param {Buffer} videoBuffer - Video file buffer
   * @returns {Promise<Buffer>} - Audio buffer (MP3 format)
   */
  async extractAudio(videoBuffer) {
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `video-${Date.now()}.mp4`);
    const outputPath = path.join(tempDir, `audio-${Date.now()}.mp3`);

    try {
      await fs.writeFile(inputPath, videoBuffer);

      await new Promise((resolve, reject) => {
        const ffmpeg = spawn("ffmpeg", [
          "-i", inputPath,
          "-vn",                    // No video
          "-acodec", "libmp3lame",  // MP3 codec
          "-ar", "16000",           // 16kHz sample rate
          "-ac", "1",               // Mono
          "-b:a", "64k",            // Bitrate
          "-y",                     // Overwrite
          outputPath,
        ]);

        let stderr = "";
        ffmpeg.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        ffmpeg.on("close", (code) => {
          if (code === 0) resolve();
          else reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
        });

        ffmpeg.on("error", reject);
      });

      const audioBuffer = await fs.readFile(outputPath);
      return audioBuffer;
    } finally {
      // Cleanup temp files
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});
    }
  }

  /**
   * Transcribe audio using Groq Whisper
   * @param {Buffer} audioBuffer - Audio file buffer
   * @returns {Promise<Object>} - Transcription result with text and metadata
   */
  async transcribeAudio(audioBuffer) {
    // Create a File object for the Groq API
    const file = new File([audioBuffer], "audio.mp3", { type: "audio/mpeg" });

    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3",
      response_format: "verbose_json",
      language: "en",
    });

    return {
      text: transcription.text,
      language: transcription.language || "en",
      duration: transcription.duration || 0,
      segments: transcription.segments || [],
    };
  }

  /**
   * Upload transcript to S3
   * @param {Object} transcript - Transcription result
   * @param {number} activityId - Activity ID
   * @returns {Promise<string>} - Public URL of the transcript
   */
  async uploadTranscript(transcript, activityId) {
    const key = `transcripts/activity/${activityId}/${Date.now()}.json`;

    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: JSON.stringify(transcript, null, 2),
        ContentType: "application/json",
      })
    );

    return `${S3_PUBLIC_URL}/${S3_BUCKET}/${key}`;
  }

  /**
   * Process a video transcription job
   * @param {number} transcriptId - VideoTranscript record ID
   */
  async processTranscription(transcriptId) {
    const record = await VideoTranscript.findByPk(transcriptId);
    if (!record) {
      throw new Error(`Transcript record ${transcriptId} not found`);
    }

    try {
      // Update status to processing
      await record.update({
        status: "processing",
        started_at: new Date(),
      });

      // Step 1: Download video from S3
      console.log(`[Transcription] Downloading video for activity ${record.activity_id}...`);
      const videoBuffer = await this.downloadVideo(record.video_url);

      // Step 2: Extract audio using ffmpeg
      console.log(`[Transcription] Extracting audio...`);
      const audioBuffer = await this.extractAudio(videoBuffer);

      // Step 3: Transcribe using Groq Whisper
      console.log(`[Transcription] Transcribing with Whisper...`);
      const transcription = await this.transcribeAudio(audioBuffer);

      // Step 4: Upload transcript to S3
      console.log(`[Transcription] Uploading transcript...`);
      const transcriptUrl = await this.uploadTranscript(transcription, record.activity_id);

      // Step 5: Update record with results
      await record.update({
        status: "completed",
        transcript_url: transcriptUrl,
        duration_seconds: Math.round(transcription.duration),
        word_count: transcription.text.split(/\s+/).filter(Boolean).length,
        language: transcription.language,
        completed_at: new Date(),
      });

      console.log(`[Transcription] Completed for activity ${record.activity_id}`);
      return record;
    } catch (error) {
      console.error(`[Transcription] Failed for activity ${record.activity_id}:`, error.message);

      await record.update({
        status: "failed",
        error_message: error.message,
        completed_at: new Date(),
      });
      throw error;
    }
  }

  /**
   * Queue a video for transcription
   * @param {number} activityId - Activity ID
   * @param {string} videoUrl - URL of the video
   * @returns {Promise<VideoTranscript>} - Created/updated transcript record
   */
  async queueTranscription(activityId, videoUrl) {
    // Create or update transcript record
    const [record, created] = await VideoTranscript.findOrCreate({
      where: { activity_id: activityId },
      defaults: {
        video_url: videoUrl,
        status: "pending",
      },
    });

    if (!created) {
      // Update existing record for retry
      await record.update({
        video_url: videoUrl,
        status: "pending",
        error_message: null,
        transcript_url: null,
        started_at: null,
        completed_at: null,
      });
    }

    // Process asynchronously (non-blocking)
    setImmediate(() => {
      this.processTranscription(record.transcript_id).catch((err) => {
        console.error(`[Transcription] Background job failed for activity ${activityId}:`, err.message);
      });
    });

    return record;
  }
}

export default new TranscriptionService();
