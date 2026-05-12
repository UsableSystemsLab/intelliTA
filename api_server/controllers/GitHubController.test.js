// Set ENCRYPTION_KEY so HMAC helpers in createState/verifyState work
process.env.ENCRYPTION_KEY = 'test-secret-key-for-unit-tests';

jest.mock('sequelize', () => ({
  __esModule: true,
  Op: { ne: Symbol('Op.ne') },
  DataTypes: {},
}));

jest.mock('../models/index.js', () => ({
  __esModule: true,
  GitHubConnection: {
    findOne: jest.fn(),
    findOrCreate: jest.fn(),
    destroy: jest.fn(),
  },
  Course: { findByPk: jest.fn() },
  User: { findOne: jest.fn(), update: jest.fn() },
  Activity: { findOne: jest.fn() },
  Enrollment: { findAll: jest.fn() },
}));

jest.mock('../utils/encryption.js', () => ({
  __esModule: true,
  encryptApiKey: jest.fn(),
  decryptApiKey: jest.fn(),
}));

jest.mock('@octokit/rest', () => ({
  __esModule: true,
  Octokit: jest.fn().mockImplementation(() => ({
    request: jest.fn(),
  })),
}));

import { GitHubConnection, Course, Activity } from '../models/index.js';
import { encryptApiKey } from '../utils/encryption.js';
import GitHubController, { buildClassroomAssignmentUrl } from '../controllers/GitHubController.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn();
  return res;
};


describe('buildClassroomAssignmentUrl', () => {
  test('returns base URL without repo when repoFullName is null', () => {
    const url = buildClassroomAssignmentUrl(42, null);
    expect(url).toBe('https://classroom.github.com/classrooms/42/assignments/new');
  });

  test('appends starter_code_repo query param when repoFullName is provided', () => {
    const url = buildClassroomAssignmentUrl(42, 'my-org/my-repo');
    expect(url).toContain('starter_code_repo=');
    expect(url).toContain(encodeURIComponent('my-org/my-repo'));
  });
});


describe('GitHubController.saveCredentials', () => {
  test('returns 400 when client_id or client_secret is missing', async () => {
    const req = { params: { courseId: '1' }, body: { github_client_id: 'id' } };
    const res = makeRes();
    await GitHubController.saveCredentials(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when course is not found', async () => {
    Course.findByPk.mockResolvedValueOnce(null);
    const req = { params: { courseId: '99' }, body: { github_client_id: 'id', github_client_secret: 'secret' } };
    const res = makeRes();
    await GitHubController.saveCredentials(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('creates new credentials and returns 201', async () => {
    Course.findByPk.mockResolvedValueOnce({ course_id: 1 });
    encryptApiKey.mockResolvedValueOnce('enc-secret');
    const connection = { id: 1, course_id: 1 };
    GitHubConnection.findOrCreate.mockResolvedValueOnce([connection, true]);
    const req = { params: { courseId: '1' }, body: { github_client_id: 'id123', github_client_secret: 'sec123' } };
    const res = makeRes();
    await GitHubController.saveCredentials(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ has_credentials: true, connected: false })
    );
  });

  test('updates existing credentials and returns 200', async () => {
    Course.findByPk.mockResolvedValueOnce({ course_id: 1 });
    encryptApiKey.mockResolvedValueOnce('enc-secret-new');
    const connection = {
      github_client_id: 'old', github_client_secret: 'old-enc',
      github_token: 'token', github_username: 'user', github_org: 'org',
      save: jest.fn().mockResolvedValueOnce(undefined),
    };
    GitHubConnection.findOrCreate.mockResolvedValueOnce([connection, false]);
    const req = { params: { courseId: '1' }, body: { github_client_id: 'new-id', github_client_secret: 'new-sec' } };
    const res = makeRes();
    await GitHubController.saveCredentials(req, res);
    expect(connection.github_token).toBeNull();
    expect(connection.github_username).toBeNull();
    expect(connection.save).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('returns 500 on database error', async () => {
    Course.findByPk.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { courseId: '1' }, body: { github_client_id: 'id', github_client_secret: 'sec' } };
    const res = makeRes();
    await GitHubController.saveCredentials(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});


describe('GitHubController.getStatus', () => {
  test('returns has_credentials: false when no connection exists', async () => {
    GitHubConnection.findOne.mockResolvedValueOnce(null);
    const req = { params: { courseId: '1' } };
    const res = makeRes();
    await GitHubController.getStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ has_credentials: false, connected: false });
  });

  test('returns connected: true when token is present', async () => {
    GitHubConnection.findOne.mockResolvedValueOnce({
      github_client_id: 'id', github_token: 'enc-token',
      github_username: 'johndoe', github_org: 'my-org',
      github_classroom_id: 42, github_classroom_name: 'CS101',
    });
    const req = { params: { courseId: '1' } };
    const res = makeRes();
    await GitHubController.getStatus(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ has_credentials: true, connected: true, github_username: 'johndoe' })
    );
  });

  test('returns connected: false when token is null', async () => {
    GitHubConnection.findOne.mockResolvedValueOnce({
      github_client_id: 'id', github_token: null,
      github_username: null, github_org: null,
      github_classroom_id: null, github_classroom_name: null,
    });
    const req = { params: { courseId: '1' } };
    const res = makeRes();
    await GitHubController.getStatus(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ connected: false })
    );
  });

  test('returns 500 on database error', async () => {
    GitHubConnection.findOne.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { courseId: '1' } };
    const res = makeRes();
    await GitHubController.getStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});


describe('GitHubController.disconnect', () => {
  test('returns 404 when no connection exists', async () => {
    GitHubConnection.findOne.mockResolvedValueOnce(null);
    const req = { params: { courseId: '1' } };
    const res = makeRes();
    await GitHubController.disconnect(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('clears token fields and returns 200', async () => {
    const connection = {
      github_token: 'enc-tok', github_username: 'user', github_org: 'org',
      save: jest.fn().mockResolvedValueOnce(undefined),
    };
    GitHubConnection.findOne.mockResolvedValueOnce(connection);
    const req = { params: { courseId: '1' } };
    const res = makeRes();
    await GitHubController.disconnect(req, res);
    expect(connection.github_token).toBeNull();
    expect(connection.github_username).toBeNull();
    expect(connection.github_org).toBeNull();
    expect(connection.save).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'GitHub disconnected successfully' });
  });

  test('returns 500 on database error', async () => {
    GitHubConnection.findOne.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { courseId: '1' } };
    const res = makeRes();
    await GitHubController.disconnect(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});


describe('GitHubController.deleteCredentials', () => {
  test('returns 404 when no connection exists', async () => {
    GitHubConnection.destroy.mockResolvedValueOnce(0);
    const req = { params: { courseId: '1' } };
    const res = makeRes();
    await GitHubController.deleteCredentials(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('destroys connection and returns 204', async () => {
    GitHubConnection.destroy.mockResolvedValueOnce(1);
    const req = { params: { courseId: '1' } };
    const res = makeRes();
    await GitHubController.deleteCredentials(req, res);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  test('returns 500 on database error', async () => {
    GitHubConnection.destroy.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { courseId: '1' } };
    const res = makeRes();
    await GitHubController.deleteCredentials(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});


describe('GitHubController.saveClassroom', () => {
  test('returns 400 when classroom_id is missing', async () => {
    const req = { params: { courseId: '1' }, body: { classroom_name: 'CS101' } };
    const res = makeRes();
    await GitHubController.saveClassroom(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'classroom_id is required' });
  });

  test('returns 404 when no connection exists', async () => {
    GitHubConnection.findOne.mockResolvedValueOnce(null);
    const req = { params: { courseId: '1' }, body: { classroom_id: 42 } };
    const res = makeRes();
    await GitHubController.saveClassroom(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('saves classroom and returns 200 with updated fields', async () => {
    const connection = {
      github_classroom_id: null, github_classroom_name: null, github_org: null,
      save: jest.fn().mockResolvedValueOnce(undefined),
    };
    GitHubConnection.findOne.mockResolvedValueOnce(connection);
    const req = {
      params: { courseId: '1' },
      body: { classroom_id: 42, classroom_name: 'CS101', classroom_org: 'my-org' },
    };
    const res = makeRes();
    await GitHubController.saveClassroom(req, res);
    expect(connection.github_classroom_id).toBe(42);
    expect(connection.github_classroom_name).toBe('CS101');
    expect(connection.github_org).toBe('my-org');
    expect(connection.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Classroom saved successfully', github_classroom_id: 42 })
    );
  });
});


describe('GitHubController.linkAssignment', () => {
  test('returns 400 when assignment_id is missing', async () => {
    const req = { params: { activityId: '1' }, body: {} };
    const res = makeRes();
    await GitHubController.linkAssignment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'assignment_id is required' });
  });

  test('returns 404 when activity is not found', async () => {
    Activity.findOne.mockResolvedValueOnce(null);
    const req = { params: { activityId: '99' }, body: { assignment_id: 10 } };
    const res = makeRes();
    await GitHubController.linkAssignment(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Activity not found' });
  });

  test('links assignment and returns 200', async () => {
    const activity = {
      activity_id: 1, github_assignment_id: null,
      save: jest.fn().mockResolvedValueOnce(undefined),
    };
    Activity.findOne.mockResolvedValueOnce(activity);
    const req = { params: { activityId: '1' }, body: { assignment_id: 10 } };
    const res = makeRes();
    await GitHubController.linkAssignment(req, res);
    expect(activity.github_assignment_id).toBe(10);
    expect(activity.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ message: 'Assignment linked', github_assignment_id: 10 });
  });

  test('returns 500 on database error', async () => {
    Activity.findOne.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { activityId: '1' }, body: { assignment_id: 10 } };
    const res = makeRes();
    await GitHubController.linkAssignment(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});


describe('GitHubController.initiateAuth', () => {
  test('returns 400 when courseId or redirect is missing', async () => {
    const req = { query: { courseId: '1' } }; 
    const res = makeRes();
    await GitHubController.initiateAuth(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when no connection exists for the course', async () => {
    GitHubConnection.findOne.mockResolvedValueOnce(null);
    const req = { query: { courseId: '1', redirect: 'https://app.example.com' } };
    const res = makeRes();
    await GitHubController.initiateAuth(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('redirects to GitHub OAuth URL with correct client_id', async () => {
    GitHubConnection.findOne.mockResolvedValueOnce({ github_client_id: 'my-client-id' });
    const req = {
      query: { courseId: '1', redirect: 'https://app.example.com/callback' },
      protocol: 'https',
      get: jest.fn().mockReturnValue('api.example.com'),
    };
    const res = makeRes();
    await GitHubController.initiateAuth(req, res);
    expect(res.redirect).toHaveBeenCalledTimes(1);
    const redirectUrl = res.redirect.mock.calls[0][0];
    expect(redirectUrl).toContain('github.com/login/oauth/authorize');
    expect(redirectUrl).toContain('client_id=my-client-id');
  });
});
