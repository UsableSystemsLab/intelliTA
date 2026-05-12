jest.mock('../models/Activity.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
  },
}));

jest.mock('../models/Submission.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../models/User.js', () => ({
  __esModule: true,
  default: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock('../models/index.js', () => ({
  __esModule: true,
  GitHubConnection: { findOne: jest.fn() },
  Enrollment: { findAll: jest.fn() },
}));

jest.mock('../services/transcriptionService.js', () => ({
  __esModule: true,
  default: { queueTranscription: jest.fn().mockResolvedValue({}) },
}));

jest.mock('../utils/encryption.js', () => ({
  __esModule: true,
  decryptApiKey: jest.fn(),
}));

jest.mock('./GitHubController.js', () => ({
  __esModule: true,
  createActivityRepo: jest.fn(),
  resolveAssignmentId: jest.fn(),
  default: { pushStudentCode: jest.fn() },
}));

import Activity from '../models/Activity.js';
import Submission from '../models/Submission.js';
import User from '../models/User.js';
import { GitHubConnection } from '../models/index.js';
import transcriptionService from '../services/transcriptionService.js';
import ActivityController from '../controllers/activityController.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('ActivityController.getActivityById', () => {
  test('returns 400 when activityId is missing', async () => {
    const req = { params: {} };
    const res = makeRes();
    await ActivityController.getActivityById(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when activity is not found', async () => {
    Activity.findOne.mockResolvedValueOnce(null);
    const req = { params: { activityId: '99' } };
    const res = makeRes();
    await ActivityController.getActivityById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Activity not found' });
  });

  test('returns activity when found', async () => {
    const activity = { activity_id: 1, title: 'Lab 1' };
    Activity.findOne.mockResolvedValueOnce(activity);
    const req = { params: { activityId: '1' } };
    const res = makeRes();
    await ActivityController.getActivityById(req, res);
    expect(res.json).toHaveBeenCalledWith(activity);
  });

  test('returns 500 on database error', async () => {
    Activity.findOne.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { activityId: '1' } };
    const res = makeRes();
    await ActivityController.getActivityById(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('ActivityController.createActivity', () => {
  test('returns 400 when courseId is missing', async () => {
    const req = { params: {}, body: { title: 'Lab', start_date: '2025-01-01', end_date: '2025-12-31' } };
    const res = makeRes();
    await ActivityController.createActivity(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 when title, start_date or end_date is missing', async () => {
    const req = { params: { courseId: '1' }, body: { title: 'Lab' } }; 
    const res = makeRes();
    await ActivityController.createActivity(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Title, Start Date, and End Date are required' });
  });

  test('creates activity without video and returns 201', async () => {
    const newActivity = { activity_id: 1, title: 'Lab 1', video_url: null };
    Activity.create.mockResolvedValueOnce(newActivity);
    const req = {
      params: { courseId: '1' },
      body: { title: 'Lab 1', start_date: '2025-01-01', end_date: '2025-12-31' },
    };
    const res = makeRes();
    await ActivityController.createActivity(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(newActivity);
    expect(transcriptionService.queueTranscription).not.toHaveBeenCalled();
  });

  test('queues transcription when video_url is present', async () => {
    const newActivity = { activity_id: 2, title: 'Video Lab', video_url: 'https://s3.example.com/v.mp4' };
    Activity.create.mockResolvedValueOnce(newActivity);
    const req = {
      params: { courseId: '1' },
      body: { title: 'Video Lab', start_date: '2025-01-01', end_date: '2025-12-31', video_url: 'https://s3.example.com/v.mp4' },
    };
    const res = makeRes();
    await ActivityController.createActivity(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(transcriptionService.queueTranscription).toHaveBeenCalledWith(2, 'https://s3.example.com/v.mp4');
  });

  test('returns 500 on database error', async () => {
    Activity.create.mockRejectedValueOnce(new Error('db error'));
    const req = {
      params: { courseId: '1' },
      body: { title: 'Lab', start_date: '2025-01-01', end_date: '2025-12-31' },
    };
    const res = makeRes();
    await ActivityController.createActivity(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('ActivityController.getActivitiesByCourse', () => {
  test('returns activities for a course ordered by start_date', async () => {
    const activities = [{ activity_id: 1 }, { activity_id: 2 }];
    Activity.findAll.mockResolvedValueOnce(activities);
    const req = { params: { courseId: '1' } };
    const res = makeRes();
    await ActivityController.getActivitiesByCourse(req, res);
    expect(Activity.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { course_id: '1' } })
    );
    expect(res.json).toHaveBeenCalledWith(activities);
  });

  test('returns empty array when no activities exist', async () => {
    Activity.findAll.mockResolvedValueOnce([]);
    const req = { params: { courseId: '99' } };
    const res = makeRes();
    await ActivityController.getActivitiesByCourse(req, res);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('returns 500 on database error', async () => {
    Activity.findAll.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { courseId: '1' } };
    const res = makeRes();
    await ActivityController.getActivitiesByCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('ActivityController.updateActivity', () => {
  test('returns 404 when activity is not found', async () => {
    Activity.findOne.mockResolvedValueOnce(null);
    const req = { params: { activityId: '99' }, body: { title: 'New Title' } };
    const res = makeRes();
    await ActivityController.updateActivity(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Activity not found' });
  });

  test('updates provided fields and returns the activity', async () => {
    const activity = {
      activity_id: 1, title: 'Old', start_date: null, end_date: null,
      video_url: null, md_file_url: null, starter_code_url: null,
      quiz_url: null, github_classroom_url: null,
      save: jest.fn().mockResolvedValueOnce(undefined),
    };
    Activity.findOne.mockResolvedValueOnce(activity);
    const req = { params: { activityId: '1' }, body: { title: 'New Title', start_date: '2025-06-01' } };
    const res = makeRes();
    await ActivityController.updateActivity(req, res);
    expect(activity.title).toBe('New Title');
    expect(activity.start_date).toBe('2025-06-01');
    expect(activity.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(activity);
  });

  test('does not overwrite undefined fields', async () => {
    const activity = {
      activity_id: 1, title: 'Keep Me', video_url: 'https://s3.example.com/v.mp4',
      start_date: null, end_date: null, md_file_url: null,
      starter_code_url: null, quiz_url: null, github_classroom_url: null,
      save: jest.fn().mockResolvedValueOnce(undefined),
    };
    Activity.findOne.mockResolvedValueOnce(activity);
    const req = { params: { activityId: '1' }, body: { start_date: '2025-01-01', end_date: '2025-12-31' } };
    const res = makeRes();
    await ActivityController.updateActivity(req, res);
    expect(activity.title).toBe('Keep Me');
    expect(activity.video_url).toBe('https://s3.example.com/v.mp4');
  });

  test('returns 500 on database error', async () => {
    Activity.findOne.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { activityId: '1' }, body: {} };
    const res = makeRes();
    await ActivityController.updateActivity(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('ActivityController.deleteActivity', () => {
  test('returns 404 when activity is not found', async () => {
    Activity.destroy.mockResolvedValueOnce(0);
    const req = { params: { activityId: '99' } };
    const res = makeRes();
    await ActivityController.deleteActivity(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Activity not found' });
  });

  test('returns 200 when activity is deleted', async () => {
    Activity.destroy.mockResolvedValueOnce(1);
    const req = { params: { activityId: '1' } };
    const res = makeRes();
    await ActivityController.deleteActivity(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Activity deleted successfully' });
  });

  test('returns 500 on database error', async () => {
    Activity.destroy.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { activityId: '1' } };
    const res = makeRes();
    await ActivityController.deleteActivity(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('ActivityController.submitActivity', () => {
  test('returns 400 when activityId is missing', async () => {
    const req = { params: {}, body: { userId: '1' } };
    const res = makeRes();
    await ActivityController.submitActivity(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 when both userId and firebaseId are missing', async () => {
    const req = { params: { activityId: '1' }, body: {} };
    const res = makeRes();
    await ActivityController.submitActivity(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'User ID or Firebase ID is required' });
  });

  test('returns 404 when user is not found by userId', async () => {
    User.findByPk.mockResolvedValueOnce(null);
    const req = { params: { activityId: '1' }, body: { userId: '99' } };
    const res = makeRes();
    await ActivityController.submitActivity(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  test('returns 404 when user is not found by firebaseId', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const req = { params: { activityId: '1' }, body: { firebaseId: 'fb_unknown' } };
    const res = makeRes();
    await ActivityController.submitActivity(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('creates new submission when none exists', async () => {
    const user = { id: 1, github_username: null, github_verified: false };
    const submission = { isNewRecord: false, score: 100 };
    User.findByPk.mockResolvedValueOnce(user);
    Submission.findOne.mockResolvedValueOnce(null);
    Submission.create.mockResolvedValueOnce(submission);
    const req = { params: { activityId: '1' }, body: { userId: '1', score: 100 } };
    const res = makeRes();
    await ActivityController.submitActivity(req, res);
    expect(Submission.create).toHaveBeenCalledWith(
      expect.objectContaining({ activity_id: '1', user_id: 1, score: 100 })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ submission })
    );
  });

  test('updates existing submission score when already submitted', async () => {
    const user = { id: 1, github_username: null, github_verified: false };
    const submission = {
      isNewRecord: false, score: 80,
      save: jest.fn().mockResolvedValueOnce(undefined),
    };
    User.findByPk.mockResolvedValueOnce(user);
    Submission.findOne.mockResolvedValueOnce(submission);
    const req = { params: { activityId: '1' }, body: { userId: '1', score: 95 } };
    const res = makeRes();
    await ActivityController.submitActivity(req, res);
    expect(submission.score).toBe(95);
    expect(submission.save).toHaveBeenCalledTimes(1);
  });

  test('skips GitHub push when user has no verified GitHub account', async () => {
    const user = { id: 1, github_username: null, github_verified: false };
    const submission = { isNewRecord: false, score: 100, save: jest.fn() };
    User.findByPk.mockResolvedValueOnce(user);
    Submission.findOne.mockResolvedValueOnce(submission);
    const req = {
      params: { activityId: '1' },
      body: { userId: '1', score: 100, files: [{ name: 'main.py', content: 'print()' }] },
    };
    const res = makeRes();
    await ActivityController.submitActivity(req, res);
    expect(GitHubConnection.findOne).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.not.objectContaining({ github: expect.anything() })
    );
  });

  test('returns 500 on unexpected error', async () => {
    User.findByPk.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { activityId: '1' }, body: { userId: '1' } };
    const res = makeRes();
    await ActivityController.submitActivity(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
