jest.mock('../models/index.js', () => ({
  __esModule: true,
  VideoTranscript: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
}));

jest.mock('../services/transcriptionService.js', () => ({
  __esModule: true,
  default: { queueTranscription: jest.fn() },
}));

jest.mock('../configs/s3.js', () => ({
  __esModule: true,
  s3: { send: jest.fn() },
  S3_BUCKET: 'test-bucket',
}));

jest.mock('@aws-sdk/client-s3', () => ({
  __esModule: true,
  GetObjectCommand: jest.fn().mockImplementation((params) => ({ _params: params })),
}));

import { VideoTranscript } from '../models/index.js';
import transcriptionService from '../services/transcriptionService.js';
import { s3 } from '../configs/s3.js';
import TranscriptController from '../controllers/transcriptController.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('TranscriptController.getActivityTranscript', () => {
  test('returns 404 when no transcript exists for the activity', async () => {
    VideoTranscript.findOne.mockResolvedValueOnce(null);
    const req = { params: { activityId: '5' } };
    const res = makeRes();
    await TranscriptController.getActivityTranscript(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Transcript not found' });
  });

  test('returns transcript metadata when found', async () => {
    const transcript = { transcript_id: 1, activity_id: 5, status: 'completed' };
    VideoTranscript.findOne.mockResolvedValueOnce(transcript);
    const req = { params: { activityId: '5' } };
    const res = makeRes();
    await TranscriptController.getActivityTranscript(req, res);
    expect(res.json).toHaveBeenCalledWith(transcript);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 500 on database error', async () => {
    VideoTranscript.findOne.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { activityId: '5' } };
    const res = makeRes();
    await TranscriptController.getActivityTranscript(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('TranscriptController.getTranscriptContent', () => {
  test('returns 404 when transcript is not found', async () => {
    VideoTranscript.findByPk.mockResolvedValueOnce(null);
    const req = { params: { transcriptId: '99' }, query: {} };
    const res = makeRes();
    await TranscriptController.getTranscriptContent(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 400 when transcript is not yet completed', async () => {
    VideoTranscript.findByPk.mockResolvedValueOnce({ transcript_id: 1, status: 'processing' });
    const req = { params: { transcriptId: '1' }, query: {} };
    const res = makeRes();
    await TranscriptController.getTranscriptContent(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Transcript not ready', status: 'processing' })
    );
  });

  test('returns 404 when the requested language URL is missing', async () => {
    VideoTranscript.findByPk.mockResolvedValueOnce({
      transcript_id: 1, status: 'completed',
      transcript_url: 'https://s3.example.com/test-bucket/t.json',
      transcript_url_ar: null,
    });
    const req = { params: { transcriptId: '1' }, query: { lang: 'ar' } };
    const res = makeRes();
    await TranscriptController.getTranscriptContent(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'No ar transcript available' });
  });

  test('fetches English content from S3 and returns parsed JSON', async () => {
    VideoTranscript.findByPk.mockResolvedValueOnce({
      transcript_id: 1, status: 'completed',
      transcript_url: 'https://s3.example.com/test-bucket/transcripts/t.json',
      transcript_url_ar: null,
    });
    const content = { segments: [{ text: 'Hello world', start: 0 }] };
    s3.send.mockResolvedValueOnce({
      Body: { transformToString: jest.fn().mockResolvedValueOnce(JSON.stringify(content)) },
    });
    const req = { params: { transcriptId: '1' }, query: { lang: 'en' } };
    const res = makeRes();
    await TranscriptController.getTranscriptContent(req, res);
    expect(s3.send).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(content);
  });

  test('fetches Arabic content from S3 when lang=ar', async () => {
    VideoTranscript.findByPk.mockResolvedValueOnce({
      transcript_id: 1, status: 'completed',
      transcript_url: 'https://s3.example.com/test-bucket/en.json',
      transcript_url_ar: 'https://s3.example.com/test-bucket/transcripts/ar.json',
    });
    const content = { segments: [{ text: 'مرحبا', start: 0 }] };
    s3.send.mockResolvedValueOnce({
      Body: { transformToString: jest.fn().mockResolvedValueOnce(JSON.stringify(content)) },
    });
    const req = { params: { transcriptId: '1' }, query: { lang: 'ar' } };
    const res = makeRes();
    await TranscriptController.getTranscriptContent(req, res);
    expect(res.json).toHaveBeenCalledWith(content);
  });

  test('returns 500 on S3 error', async () => {
    VideoTranscript.findByPk.mockResolvedValueOnce({
      transcript_id: 1, status: 'completed',
      transcript_url: 'https://s3.example.com/test-bucket/t.json',
      transcript_url_ar: null,
    });
    s3.send.mockRejectedValueOnce(new Error('S3 access denied'));
    const req = { params: { transcriptId: '1' }, query: {} };
    const res = makeRes();
    await TranscriptController.getTranscriptContent(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('TranscriptController.getTranscriptStatus', () => {
  test('returns 404 when transcript is not found', async () => {
    VideoTranscript.findByPk.mockResolvedValueOnce(null);
    const req = { params: { transcriptId: '99' } };
    const res = makeRes();
    await TranscriptController.getTranscriptStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns status fields when transcript is found', async () => {
    const status = { transcript_id: 1, status: 'completed', created_at: '2025-01-01' };
    VideoTranscript.findByPk.mockResolvedValueOnce(status);
    const req = { params: { transcriptId: '1' } };
    const res = makeRes();
    await TranscriptController.getTranscriptStatus(req, res);
    expect(res.json).toHaveBeenCalledWith(status);
  });

  test('returns 500 on database error', async () => {
    VideoTranscript.findByPk.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { transcriptId: '1' } };
    const res = makeRes();
    await TranscriptController.getTranscriptStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('TranscriptController.triggerTranscription', () => {
  test('returns 400 when activityId or videoUrl is missing', async () => {
    const req = { body: { activityId: '5' } }; 
    const res = makeRes();
    await TranscriptController.triggerTranscription(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'activityId and videoUrl are required' });
  });

  test('queues transcription and returns 202', async () => {
    const record = { transcript_id: 1, status: 'pending' };
    transcriptionService.queueTranscription.mockResolvedValueOnce(record);
    const req = { body: { activityId: '5', videoUrl: 'https://s3.example.com/video.mp4' } };
    const res = makeRes();
    await TranscriptController.triggerTranscription(req, res);
    expect(transcriptionService.queueTranscription).toHaveBeenCalledWith('5', 'https://s3.example.com/video.mp4');
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ message: 'Transcription queued', transcript: record });
  });

  test('returns 500 when queuing fails', async () => {
    transcriptionService.queueTranscription.mockRejectedValueOnce(new Error('queue error'));
    const req = { body: { activityId: '5', videoUrl: 'https://s3.example.com/video.mp4' } };
    const res = makeRes();
    await TranscriptController.triggerTranscription(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
