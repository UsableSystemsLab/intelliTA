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
import { decryptApiKey } from '../utils/encryption.js';
import GitHubController, { createActivityRepo, resolveAssignmentId } from './GitHubController.js';
import ActivityController from '../controllers/activityController.js';

// Allow async fire-and-forget work (.catch chains, queued microtasks) to settle.
const flush = () => new Promise(resolve => setImmediate(resolve));

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

  test('pushes code to GitHub when user has verified account and classroom is set up', async () => {
    const user = { id: 1, github_username: 'alice', github_verified: true };
    const submission = { isNewRecord: false, score: 100, save: jest.fn() };
    const activity = {
      activity_id: 5, title: 'Lab 5', course_id: 10,
      github_assignment_id: null, github_repo_url: 'https://github.com/o/lab-5',
      update: jest.fn().mockResolvedValueOnce(undefined),
    };
    User.findByPk.mockResolvedValueOnce(user);
    Submission.findOne.mockResolvedValueOnce(submission);
    Activity.findOne.mockResolvedValueOnce(activity);
    GitHubConnection.findOne.mockResolvedValueOnce({
      github_token: 'enc', github_classroom_id: 99,
    });
    decryptApiKey.mockResolvedValueOnce('gh_token');
    resolveAssignmentId.mockResolvedValueOnce(42);
    GitHubController.pushStudentCode.mockResolvedValueOnce({
      commitUrl: 'https://github.com/o/lab-5/commit/abc',
    });

    const req = {
      params: { activityId: '5', courseId: '10' },
      body: {
        userId: '1', score: 90,
        files: [{ name: 'main.py', content: 'print(1)' }],
        checkpoints: [{ id: 'c1', title: 'Runs', type: 'run', passed: true }],
      },
    };
    const res = makeRes();
    await ActivityController.submitActivity(req, res);

    expect(resolveAssignmentId).toHaveBeenCalledWith('gh_token', 99, 'https://github.com/o/lab-5');
    expect(activity.update).toHaveBeenCalledWith({ github_assignment_id: 42 });
    expect(GitHubController.pushStudentCode).toHaveBeenCalledWith(
      'gh_token', 42, 'alice',
      expect.arrayContaining([
        { name: 'main.py', content: 'print(1)' },
        expect.objectContaining({ name: 'intellita/grade.json' }),
        expect.objectContaining({ name: 'intellita/SUBMISSION.md' }),
      ]),
      expect.objectContaining({ gradeReadmeSection: expect.stringContaining('intelliTA Submission') }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ github: expect.objectContaining({ commitUrl: expect.any(String) }) })
    );
  });

  test('skips GitHub push when course has no connection token', async () => {
    const user = { id: 1, github_username: 'alice', github_verified: true };
    const submission = { isNewRecord: false, score: 100, save: jest.fn() };
    const activity = { activity_id: 5, course_id: 10 };
    User.findByPk.mockResolvedValueOnce(user);
    Submission.findOne.mockResolvedValueOnce(submission);
    Activity.findOne.mockResolvedValueOnce(activity);
    GitHubConnection.findOne.mockResolvedValueOnce(null);
    const req = {
      params: { activityId: '5', courseId: '10' },
      body: { userId: '1', files: [{ name: 'a.py', content: 'x' }] },
    };
    const res = makeRes();
    await ActivityController.submitActivity(req, res);
    expect(GitHubController.pushStudentCode).not.toHaveBeenCalled();
  });

  test('skips when activity has no resolvable Classroom assignment', async () => {
    const user = { id: 1, github_username: 'alice', github_verified: true };
    const submission = { isNewRecord: false, score: 100, save: jest.fn() };
    const activity = {
      activity_id: 5, course_id: 10,
      github_assignment_id: null, github_repo_url: null,
      update: jest.fn(),
    };
    User.findByPk.mockResolvedValueOnce(user);
    Submission.findOne.mockResolvedValueOnce(submission);
    Activity.findOne.mockResolvedValueOnce(activity);
    GitHubConnection.findOne.mockResolvedValueOnce({ github_token: 'enc', github_classroom_id: null });
    decryptApiKey.mockResolvedValueOnce('gh_token');
    const req = {
      params: { activityId: '5' },
      body: { userId: '1', files: [{ name: 'a.py', content: 'x' }] },
    };
    const res = makeRes();
    await ActivityController.submitActivity(req, res);
    expect(GitHubController.pushStudentCode).not.toHaveBeenCalled();
  });

  test('captures error in githubResult when push throws', async () => {
    const user = { id: 1, github_username: 'alice', github_verified: true };
    const submission = { isNewRecord: false, score: 100, save: jest.fn() };
    const activity = {
      activity_id: 5, course_id: 10,
      github_assignment_id: 7, github_repo_url: 'url',
    };
    User.findByPk.mockResolvedValueOnce(user);
    Submission.findOne.mockResolvedValueOnce(submission);
    Activity.findOne.mockResolvedValueOnce(activity);
    GitHubConnection.findOne.mockResolvedValueOnce({ github_token: 'enc', github_classroom_id: 99 });
    decryptApiKey.mockResolvedValueOnce('gh_token');
    GitHubController.pushStudentCode.mockRejectedValueOnce(new Error('push failed'));
    const req = {
      params: { activityId: '5' },
      body: { userId: '1', files: [{ name: 'a.py', content: 'x' }] },
    };
    const res = makeRes();
    await ActivityController.submitActivity(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ github: { error: 'push failed' } })
    );
  });
});

describe('ActivityController.createActivity GitHub repo branch', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => {
    delete global.fetch;
  });

  test('skips repo creation when course has no GitHubConnection', async () => {
    Activity.create.mockResolvedValueOnce({ activity_id: 1, title: 'T', video_url: null });
    GitHubConnection.findOne.mockResolvedValueOnce(null);
    const req = {
      params: { courseId: '1' },
      body: {
        title: 'T', start_date: 's', end_date: 'e',
        create_github_repo: 'true',
        _md_content: '# hi',
      },
    };
    const res = makeRes();
    await ActivityController.createActivity(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    await flush();
    expect(createActivityRepo).not.toHaveBeenCalled();
  });

  test('creates repo with md, starter code, and test files when connection exists', async () => {
    const savedActivity = {
      activity_id: 2, title: 'Lab 2', video_url: null,
      update: jest.fn().mockResolvedValueOnce(undefined),
    };
    Activity.create.mockResolvedValueOnce(savedActivity);
    GitHubConnection.findOne.mockResolvedValueOnce({
      github_token: 'enc', github_username: 'alice', github_org: 'kau-org',
      github_classroom_id: null,
    });
    decryptApiKey.mockResolvedValueOnce('gh_token');
    createActivityRepo.mockResolvedValueOnce({
      repoUrl: 'https://github.com/kau-org/lab-2',
      repoFullName: 'kau-org/lab-2',
    });
    const req = {
      params: { courseId: '10' },
      body: {
        title: 'Lab 2', start_date: 's', end_date: 'e',
        create_github_repo: 'true',
        _md_content: '# Lab',
        _starter_code_content: JSON.stringify([{ name: 'main.py', content: 'print()' }]),
        _tests_manifest_parsed: { test_files: [{ path: 'tests/test_main.py', content: 'def test_ok(): pass' }] },
      },
    };
    const res = makeRes();
    await ActivityController.createActivity(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    await flush();
    expect(createActivityRepo).toHaveBeenCalledWith(
      'gh_token', 'alice', 'lab-2',
      expect.arrayContaining([
        { path: 'README.md', content: '# Lab' },
        { path: 'main.py', content: 'print()' },
        { path: 'tests/test_main.py', content: 'def test_ok(): pass' },
      ]),
      'kau-org',
    );
    expect(savedActivity.update).toHaveBeenCalledWith(
      expect.objectContaining({ github_repo_url: 'https://github.com/kau-org/lab-2' })
    );
  });

  test('resolves org from classroom when github_org is missing', async () => {
    const savedActivity = {
      activity_id: 3, title: 'Lab 3', video_url: null, update: jest.fn(),
    };
    const connection = {
      github_token: 'enc', github_username: 'alice', github_org: null,
      github_classroom_id: 123,
      save: jest.fn().mockResolvedValueOnce(undefined),
    };
    Activity.create.mockResolvedValueOnce(savedActivity);
    GitHubConnection.findOne.mockResolvedValueOnce(connection);
    decryptApiKey.mockResolvedValueOnce('gh_token');
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ organization: { login: 'resolved-org' } }),
    });
    createActivityRepo.mockResolvedValueOnce({ repoUrl: 'url', repoFullName: 'resolved-org/lab-3' });

    const req = {
      params: { courseId: '10' },
      body: {
        title: 'Lab 3', start_date: 's', end_date: 'e',
        create_github_repo: 'true', _md_content: '# x',
      },
    };
    const res = makeRes();
    await ActivityController.createActivity(req, res);
    await flush();
    expect(connection.github_org).toBe('resolved-org');
    expect(connection.save).toHaveBeenCalled();
  });

  test('tolerates classroom fetch error and continues', async () => {
    const savedActivity = { activity_id: 4, title: 'Lab 4', video_url: null, update: jest.fn() };
    Activity.create.mockResolvedValueOnce(savedActivity);
    GitHubConnection.findOne.mockResolvedValueOnce({
      github_token: 'enc', github_username: 'alice', github_org: null,
      github_classroom_id: 123,
    });
    decryptApiKey.mockResolvedValueOnce('gh_token');
    global.fetch.mockRejectedValueOnce(new Error('network'));
    createActivityRepo.mockResolvedValueOnce({ repoUrl: 'url', repoFullName: null });
    const req = {
      params: { courseId: '10' },
      body: {
        title: 'Lab 4', start_date: 's', end_date: 'e',
        create_github_repo: 'true', _md_content: '# x',
      },
    };
    const res = makeRes();
    await ActivityController.createActivity(req, res);
    await flush();
    // Should still attempt repo creation despite the fetch error
    expect(createActivityRepo).toHaveBeenCalled();
  });

  test('tolerates createActivityRepo failure without throwing', async () => {
    const savedActivity = { activity_id: 5, title: 'Lab 5', video_url: null, update: jest.fn() };
    Activity.create.mockResolvedValueOnce(savedActivity);
    GitHubConnection.findOne.mockResolvedValueOnce({
      github_token: 'enc', github_username: 'alice', github_org: 'org',
    });
    decryptApiKey.mockResolvedValueOnce('gh_token');
    createActivityRepo.mockRejectedValueOnce(new Error('repo fail'));
    const req = {
      params: { courseId: '10' },
      body: {
        title: 'Lab 5', start_date: 's', end_date: 'e',
        create_github_repo: 'true', _md_content: '# x',
      },
    };
    const res = makeRes();
    await ActivityController.createActivity(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    await flush();
    expect(savedActivity.update).not.toHaveBeenCalled();
  });

  test('tolerates invalid starter_code JSON', async () => {
    const savedActivity = { activity_id: 6, title: 'Lab 6', video_url: null, update: jest.fn() };
    Activity.create.mockResolvedValueOnce(savedActivity);
    GitHubConnection.findOne.mockResolvedValueOnce({
      github_token: 'enc', github_username: 'alice', github_org: 'org',
    });
    decryptApiKey.mockResolvedValueOnce('gh_token');
    createActivityRepo.mockResolvedValueOnce({ repoUrl: 'url' });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const req = {
      params: { courseId: '10' },
      body: {
        title: 'Lab 6', start_date: 's', end_date: 'e',
        create_github_repo: 'true',
        _md_content: '# x',
        _starter_code_content: 'not-json',
      },
    };
    const res = makeRes();
    await ActivityController.createActivity(req, res);
    await flush();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
