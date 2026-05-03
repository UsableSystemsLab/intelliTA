import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { s3, S3_BUCKET, S3_PUBLIC_URL } from "../configs/s3.js";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { VideoTranscript } from "../models/index.js";

// Whisper configuration
const WHISPER_HOST = process.env.WHISPER_HOST || "whisper_server_container";
const WHISPER_PORT = process.env.WHISPER_PORT || "8001";
const WHISPER_URL = `http://${WHISPER_HOST}:${WHISPER_PORT}`;

// Azure Translator configuration
const AZURE_TRANSLATOR_KEY = process.env.AZURE_TRANSLATOR_KEY;
const AZURE_TRANSLATOR_REGION = process.env.AZURE_TRANSLATOR_REGION;
const AZURE_TRANSLATOR_URL = "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=ar";

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
    const bucketIdx = pathParts.indexOf(S3_BUCKET);
    const key = bucketIdx !== -1
      ? pathParts.slice(bucketIdx + 1).join("/")
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
   * @returns {Promise<Buffer>} - Audio buffer (WAV format)
   */
  async extractAudio(videoBuffer) {
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `video-${Date.now()}.mp4`);
    const outputPath = path.join(tempDir, `audio-${Date.now()}.wav`);

    try {
      await fs.writeFile(inputPath, videoBuffer);

      await new Promise((resolve, reject) => {
        const ffmpeg = spawn("ffmpeg", [
          "-i", inputPath,
          "-vn",                    // No video
          "-acodec", "pcm_s16le",   // WAV codec
          "-ar", "16000",           // 16kHz sample rate
          "-ac", "1",               // Mono
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
   * Transcribe audio using local Whisper microservice
   * @param {Buffer} audioBuffer - Audio file buffer
   * @returns {Promise<Object>} - Transcription result with text and metadata
   */
  async transcribeAudio(audioBuffer) {
    // Create FormData with the audio file
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: "audio/wav" });
    formData.append("file", blob, "audio.wav");
    formData.append("language", "en");

    // Send to Whisper microservice
    const response = await fetch(`${WHISPER_URL}/transcribe`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Whisper service error: ${error}`);
    }

    const transcription = await response.json();

    return {
      text: transcription.text,
      language: transcription.language || "en",
      duration: transcription.duration || 0,
      segments: transcription.segments || [],
    };
  }

  /**
   * Translate an array of text strings from English to Arabic using Azure Translator.
   * Handles batching to stay within Azure limits (max 100 elements, 10,000 chars per request).
   * @param {string[]} texts - Array of English text strings
   * @returns {Promise<string[]>} - Array of Arabic translations (same order)
   */
  async translateSegments(texts) {
    if (!AZURE_TRANSLATOR_KEY || !AZURE_TRANSLATOR_REGION) {
      throw new Error("Azure Translator credentials not configured");
    }

    const results = [];

    // Chunk texts to respect Azure limits: max 100 elements AND 10,000 total chars per request
    const batches = [];
    let currentBatch = [];
    let currentCharCount = 0;

    for (const text of texts) {
      const textLen = text.length;
      if (currentBatch.length >= 100 || (currentCharCount + textLen > 10000 && currentBatch.length > 0)) {
        batches.push(currentBatch);
        currentBatch = [];
        currentCharCount = 0;
      }
      currentBatch.push({ Text: text });
      currentCharCount += textLen;
    }
    if (currentBatch.length > 0) batches.push(currentBatch);

    for (const batch of batches) {
      const response = await fetch(AZURE_TRANSLATOR_URL, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_TRANSLATOR_KEY,
          "Ocp-Apim-Subscription-Region": AZURE_TRANSLATOR_REGION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Azure Translator error (${response.status}): ${error}`);
      }

      const data = await response.json();
      for (const item of data) {
        results.push(item.translations[0].text);
      }
    }

    return results;
  }

  /**
   * Upload transcript to S3
   * @param {Object} transcript - Transcription result
   * @param {number} activityId - Activity ID
   * @param {string} suffix - File suffix (e.g. 'en' or 'ar')
   * @returns {Promise<string>} - Public URL of the transcript
   */
  async uploadTranscript(transcript, activityId, suffix = "en") {
    const key = `transcripts/activity/${activityId}/${Date.now()}_${suffix}.json`;

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

      // Step 3: Transcribe using local Whisper service
      console.log(`[Transcription] Transcribing with Whisper...`);
      const transcription = await this.transcribeAudio(audioBuffer);

      // Step 4: Upload English transcript to S3
      console.log(`[Transcription] Uploading English transcript...`);
      const transcriptUrl = await this.uploadTranscript(transcription, record.activity_id, "en");

      // Step 4.5: Translate and upload Arabic transcript to S3
      let transcriptUrlAr = null;
      try {
        console.log(`[Transcription] Translating to Arabic...`);
        const englishTexts = transcription.segments.map((seg) => seg.text);
        const allTexts = [transcription.text, ...englishTexts];
        const arabicTexts = await this.translateSegments(allTexts);

        const arabicTranscript = {
          text: arabicTexts[0],
          language: "ar",
          duration: transcription.duration,
          segments: transcription.segments.map((seg, i) => ({
            start: seg.start,
            end: seg.end,
            text: arabicTexts[i + 1] || "",
          })),
        };

        transcriptUrlAr = await this.uploadTranscript(arabicTranscript, record.activity_id, "ar");
        console.log(`[Transcription] Arabic translation completed.`);
      } catch (translationError) {
        console.warn(`[Transcription] Arabic translation failed, saving English-only:`, translationError.message);
      }

      // Step 5: Update record with results
      await record.update({
        status: "completed",
        transcript_url: transcriptUrl,
        transcript_url_ar: transcriptUrlAr,
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
        transcript_url_ar: null,
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
