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

jest.mock('@octokit/rest', () => {
  const Octokit = jest.fn().mockImplementation(() => ({
    request: jest.fn(),
    rest: {
      git: {
        getRef: jest.fn(),
        getCommit: jest.fn(),
        createBlob: jest.fn(),
        createTree: jest.fn(),
        createCommit: jest.fn(),
        updateRef: jest.fn(),
      },
      repos: { getContent: jest.fn() },
    },
  }));
  return { __esModule: true, Octokit };
});

import { Octokit } from '@octokit/rest';
import { GitHubConnection, Course, User, Activity, Enrollment } from '../models/index.js';
import { encryptApiKey, decryptApiKey } from '../utils/encryption.js';
import GitHubController, {
  buildClassroomAssignmentUrl,
  createActivityRepo,
  resolveAssignmentId,
} from '../controllers/GitHubController.js';

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
  test('unlinks the assignment when assignment_id is missing', async () => {
    const activity = {
      activity_id: 1,
      github_assignment_id: 10,
      github_classroom_url: 'https://classroom.github.com/a/abc',
      save: jest.fn().mockResolvedValueOnce(undefined),
    };
    Activity.findOne.mockResolvedValueOnce(activity);
    const req = { params: { activityId: '1' }, body: {} };
    const res = makeRes();
    await GitHubController.linkAssignment(req, res);
    expect(activity.github_assignment_id).toBeNull();
    expect(activity.github_classroom_url).toBeNull();
    expect(activity.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Assignment unlinked', github_assignment_id: null })
    );
  });

  test('returns 400 when assignment_id is not a positive integer', async () => {
    Activity.findOne.mockResolvedValueOnce({ activity_id: 1, save: jest.fn() });
    const req = { params: { activityId: '1' }, body: { assignment_id: 'not-a-number' } };
    const res = makeRes();
    await GitHubController.linkAssignment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'assignment_id must be a positive integer or null' });
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

  test('returns 500 on database error', async () => {
    GitHubConnection.findOne.mockRejectedValueOnce(new Error('db down'));
    const req = {
      query: { courseId: '1', redirect: 'https://app.example.com' },
      protocol: 'https',
      get: jest.fn().mockReturnValue('api.example.com'),
    };
    const res = makeRes();
    await GitHubController.initiateAuth(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('GitHubController.initiateStudentAuth', () => {
  test('returns 400 when required query params are missing', async () => {
    const req = { query: { firebaseId: 'fb1' } };
    const res = makeRes();
    await GitHubController.initiateStudentAuth(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('redirects to error page when user is not found', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const req = {
      query: { firebaseId: 'fb_unknown', courseId: '1', redirect: 'https://app/r' },
      protocol: 'https',
      get: jest.fn().mockReturnValue('api'),
    };
    const res = makeRes();
    await GitHubController.initiateStudentAuth(req, res);
    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining('github=error')
    );
  });

  test('redirects to error page when no GitHub config for course', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    GitHubConnection.findOne.mockResolvedValueOnce(null);
    const req = {
      query: { firebaseId: 'fb1', courseId: '1', redirect: 'https://app/r' },
      protocol: 'https',
      get: jest.fn().mockReturnValue('api'),
    };
    const res = makeRes();
    await GitHubController.initiateStudentAuth(req, res);
    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining('GitHub+not+configured')
    );
  });

  test('redirects to GitHub OAuth with read:user scope and state', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    GitHubConnection.findOne.mockResolvedValueOnce({ github_client_id: 'student-client' });
    const req = {
      query: { firebaseId: 'fb1', courseId: '1', redirect: 'https://app/r' },
      protocol: 'https',
      get: jest.fn().mockReturnValue('api.example.com'),
    };
    const res = makeRes();
    await GitHubController.initiateStudentAuth(req, res);
    const url = res.redirect.mock.calls[0][0];
    expect(url).toContain('github.com/login/oauth/authorize');
    expect(url).toContain('client_id=student-client');
    expect(url).toContain('scope=read%3Auser');
  });

  test('redirects to fallback error page on unexpected error', async () => {
    User.findOne.mockRejectedValueOnce(new Error('boom'));
    const req = {
      query: { firebaseId: 'fb1', courseId: '1', redirect: 'https://app/r' },
      protocol: 'https',
      get: jest.fn().mockReturnValue('api'),
    };
    const res = makeRes();
    await GitHubController.initiateStudentAuth(req, res);
    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining('github=error')
    );
  });
});

describe('GitHubController.handleCallback', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => {
    delete global.fetch;
  });

  // Build a valid state token by calling createState via initiateAuth.
  const buildState = async (data) => {
    GitHubConnection.findOne.mockResolvedValueOnce({ github_client_id: 'x' });
    const req = {
      query: { courseId: data.courseId, redirect: data.redirect },
      protocol: 'https',
      get: () => 'api',
    };
    const res = makeRes();
    await GitHubController.initiateAuth(req, res);
    const url = res.redirect.mock.calls[0][0];
    return new URL(url).searchParams.get('state');
  };

  const buildStudentState = async (data) => {
    User.findOne.mockResolvedValueOnce({ id: data.userId });
    GitHubConnection.findOne.mockResolvedValueOnce({ github_client_id: 'x' });
    const req = {
      query: { firebaseId: 'fb1', courseId: data.courseId, redirect: data.redirect },
      protocol: 'https',
      get: () => 'api',
    };
    const res = makeRes();
    await GitHubController.initiateStudentAuth(req, res);
    const url = res.redirect.mock.calls[0][0];
    return new URL(url).searchParams.get('state');
  };

  test('redirects to fallback "/" with invalid state', async () => {
    const req = { query: { code: 'c', state: 'not-base64.invalid' } };
    const res = makeRes();
    await GitHubController.handleCallback(req, res);
    expect(res.redirect).toHaveBeenCalledWith(expect.stringMatching(/^\/\?github=error/));
  });

  test('instructor flow: saves token on success and redirects', async () => {
    const state = await buildState({ courseId: '5', redirect: 'https://app/inst' });
    const connection = {
      github_client_id: 'cid',
      github_client_secret: 'enc-sec',
      github_token: null, github_username: null, github_org: 'x',
      save: jest.fn().mockResolvedValueOnce(undefined),
    };
    GitHubConnection.findOne.mockResolvedValueOnce(connection);
    decryptApiKey.mockResolvedValueOnce('plain-sec');
    global.fetch
      .mockResolvedValueOnce({ json: () => Promise.resolve({ access_token: 'ghp_xyz' }) })
      .mockResolvedValueOnce({ json: () => Promise.resolve({ login: 'alice' }) });
    encryptApiKey.mockResolvedValueOnce('enc-token');

    const res = makeRes();
    await GitHubController.handleCallback({ query: { code: 'CODE', state } }, res);
    expect(connection.github_token).toBe('enc-token');
    expect(connection.github_username).toBe('alice');
    expect(connection.github_org).toBeNull();
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('github=connected'));
  });

  test('instructor flow: redirects with error when token exchange returns error', async () => {
    const state = await buildState({ courseId: '5', redirect: 'https://app/inst' });
    GitHubConnection.findOne.mockResolvedValueOnce({
      github_client_id: 'cid', github_client_secret: 'enc-sec',
    });
    decryptApiKey.mockResolvedValueOnce('plain-sec');
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ error: 'bad_code', error_description: 'oops' }),
    });
    const res = makeRes();
    await GitHubController.handleCallback({ query: { code: 'CODE', state } }, res);
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('oops'));
  });

  test('instructor flow: redirects with error when no connection', async () => {
    const state = await buildState({ courseId: '5', redirect: 'https://app/inst' });
    GitHubConnection.findOne.mockResolvedValueOnce(null);
    const res = makeRes();
    await GitHubController.handleCallback({ query: { code: 'CODE', state } }, res);
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('No+credentials+found'));
  });

  test('student flow: marks user as github_verified on success', async () => {
    const state = await buildStudentState({ userId: 7, courseId: '5', redirect: 'https://app/std' });
    GitHubConnection.findOne.mockResolvedValueOnce({
      github_client_id: 'cid', github_client_secret: 'enc-sec',
    });
    decryptApiKey.mockResolvedValueOnce('plain-sec');
    global.fetch
      .mockResolvedValueOnce({ json: () => Promise.resolve({ access_token: 'ghp_xyz' }) })
      .mockResolvedValueOnce({ json: () => Promise.resolve({ login: 'bob' }) });
    User.update.mockResolvedValueOnce([1]);
    const res = makeRes();
    await GitHubController.handleCallback({ query: { code: 'CODE', state } }, res);
    expect(User.update).toHaveBeenCalledWith(
      { github_username: 'bob', github_verified: true },
      { where: { id: 7 } }
    );
    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining('github=verified')
    );
  });

  test('student flow: redirects with error when connection lost', async () => {
    const state = await buildStudentState({ userId: 7, courseId: '5', redirect: 'https://app/std' });
    GitHubConnection.findOne.mockResolvedValueOnce(null);
    const res = makeRes();
    await GitHubController.handleCallback({ query: { code: 'CODE', state } }, res);
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('Connection+lost'));
  });

  test('student flow: redirects with error when token exchange fails', async () => {
    const state = await buildStudentState({ userId: 7, courseId: '5', redirect: 'https://app/std' });
    GitHubConnection.findOne.mockResolvedValueOnce({ github_client_id: 'c', github_client_secret: 'enc' });
    decryptApiKey.mockResolvedValueOnce('p');
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ error: 'bad_code' }),
    });
    const res = makeRes();
    await GitHubController.handleCallback({ query: { code: 'CODE', state } }, res);
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('bad_code'));
  });
});

describe('GitHubController.listClassrooms', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => {
    delete global.fetch;
  });

  test('returns 400 when GitHub is not connected', async () => {
    GitHubConnection.findOne.mockResolvedValueOnce(null);
    const res = makeRes();
    await GitHubController.listClassrooms({ params: { courseId: '1' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('forwards GitHub error status on classroom list failure', async () => {
    GitHubConnection.findOne.mockResolvedValueOnce({ github_token: 'enc' });
    decryptApiKey.mockResolvedValueOnce('tok');
    global.fetch.mockResolvedValueOnce({
      ok: false, status: 403,
      json: () => Promise.resolve({ message: 'forbidden' }),
    });
    const res = makeRes();
    await GitHubController.listClassrooms({ params: { courseId: '1' } }, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns mapped classrooms on success', async () => {
    GitHubConnection.findOne.mockResolvedValueOnce({ github_token: 'enc' });
    decryptApiKey.mockResolvedValueOnce('tok');
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { id: 1, name: 'A', url: 'u1', organization: { login: 'org-a' } },
        { id: 2, name: 'B', url: 'u2' },
      ]),
    });
    const res = makeRes();
    await GitHubController.listClassrooms({ params: { courseId: '1' } }, res);
    expect(res.json).toHaveBeenCalledWith([
      { id: 1, name: 'A', url: 'u1', organization: 'org-a' },
      { id: 2, name: 'B', url: 'u2', organization: null },
    ]);
  });

  test('returns 500 on unexpected error', async () => {
    GitHubConnection.findOne.mockRejectedValueOnce(new Error('db'));
    const res = makeRes();
    await GitHubController.listClassrooms({ params: { courseId: '1' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('GitHubController.listAssignments', () => {
  test('returns 400 when GitHub is not connected', async () => {
    GitHubConnection.findOne.mockResolvedValueOnce(null);
    const res = makeRes();
    await GitHubController.listAssignments({ params: { courseId: '1' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 when no classroom is linked', async () => {
    GitHubConnection.findOne.mockResolvedValueOnce({ github_token: 'enc', github_classroom_id: null });
    const res = makeRes();
    await GitHubController.listAssignments({ params: { courseId: '1' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns mapped assignments on success', async () => {
    GitHubConnection.findOne.mockResolvedValueOnce({
      github_token: 'enc', github_classroom_id: 42,
    });
    decryptApiKey.mockResolvedValueOnce('tok');
    const request = jest.fn().mockResolvedValueOnce({
      data: [
        {
          id: 1, title: 'A1', slug: 'a-1', type: 'individual',
          invite_link: 'inv1', accepted: 5, submissions: 3,
          starter_code_repository: { full_name: 'org/starter' },
        },
        {
          id: 2, title: 'A2', slug: 'a-2', type: 'group',
          invite_link: 'inv2', accepted: 0, submissions: 0,
        },
      ],
    });
    Octokit.mockImplementationOnce(() => ({ request }));
    const res = makeRes();
    await GitHubController.listAssignments({ params: { courseId: '1' } }, res);
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ id: 1, starter_code_repository: 'org/starter' }),
      expect.objectContaining({ id: 2, starter_code_repository: null }),
    ]);
  });

  test('returns 500 on unexpected error', async () => {
    GitHubConnection.findOne.mockResolvedValueOnce({
      github_token: 'enc', github_classroom_id: 42,
    });
    decryptApiKey.mockResolvedValueOnce('tok');
    const request = jest.fn().mockRejectedValueOnce(new Error('boom'));
    Octokit.mockImplementationOnce(() => ({ request }));
    const res = makeRes();
    await GitHubController.listAssignments({ params: { courseId: '1' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('GitHubController.getAcceptances', () => {
  test('returns 404 when activity is not found', async () => {
    Activity.findOne.mockResolvedValueOnce(null);
    const res = makeRes();
    await GitHubController.getAcceptances({ params: { courseId: '1', activityId: '99' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 400 when GitHub is not connected', async () => {
    Activity.findOne.mockResolvedValueOnce({ activity_id: 1 });
    GitHubConnection.findOne.mockResolvedValueOnce(null);
    const res = makeRes();
    await GitHubController.getAcceptances({ params: { courseId: '1', activityId: '1' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 when no assignment can be resolved', async () => {
    Activity.findOne.mockResolvedValueOnce({
      activity_id: 1, github_assignment_id: null, github_repo_url: null,
    });
    GitHubConnection.findOne.mockResolvedValueOnce({
      github_token: 'enc', github_classroom_id: 42,
    });
    decryptApiKey.mockResolvedValueOnce('tok');
    const res = makeRes();
    await GitHubController.getAcceptances({ params: { courseId: '1', activityId: '1' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns enrollment-cross-referenced acceptances', async () => {
    Activity.findOne.mockResolvedValueOnce({
      activity_id: 1, github_assignment_id: 7,
    });
    GitHubConnection.findOne.mockResolvedValueOnce({
      github_token: 'enc', github_classroom_id: 42,
    });
    decryptApiKey.mockResolvedValueOnce('tok');
    const request = jest.fn().mockResolvedValueOnce({
      data: [
        {
          students: [{ login: 'Alice' }],
          repository: { html_url: 'https://github.com/org/alice-1' },
          commit_count: 3, submitted: true, grade: 100,
        },
      ],
    });
    Octokit.mockImplementationOnce(() => ({ request }));
    Enrollment.findAll.mockResolvedValueOnce([
      { user: { id: 1, fName: 'Alice', lName: 'A', email: 'a@x', github_username: 'alice', github_verified: true } },
      { user: { id: 2, fName: 'Bob', lName: 'B', email: 'b@x', github_username: null, github_verified: false } },
    ]);
    const res = makeRes();
    await GitHubController.getAcceptances({ params: { courseId: '1', activityId: '1' } }, res);
    const body = res.json.mock.calls[0][0];
    expect(body.assignment_id).toBe(7);
    expect(body.total_enrolled).toBe(2);
    expect(body.accepted_count).toBe(1);
    expect(body.students[0].github_username).toBe('alice');
    expect(body.students[0].accepted).toBe(true);
    expect(body.students[1].accepted).toBe(false);
  });

  test('returns 500 on unexpected error', async () => {
    Activity.findOne.mockRejectedValueOnce(new Error('db'));
    const res = makeRes();
    await GitHubController.getAcceptances({ params: { courseId: '1', activityId: '1' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('resolveAssignmentId', () => {
  test('returns null for empty repoUrl', async () => {
    const result = await resolveAssignmentId('tok', 42, null);
    expect(result).toBeNull();
  });

  test('matches by starter_code_repository full_name', async () => {
    const request = jest.fn().mockResolvedValueOnce({
      data: [
        { id: 1, title: 'A1', starter_code_repository: { full_name: 'org/other' } },
        { id: 2, title: 'A2', starter_code_repository: { full_name: 'org/lab-x' } },
      ],
    });
    Octokit.mockImplementationOnce(() => ({ request }));
    const result = await resolveAssignmentId('tok', 42, 'https://github.com/org/lab-x');
    expect(result).toBe(2);
  });

  test('falls back to slugified title match', async () => {
    const request = jest.fn().mockResolvedValueOnce({
      data: [{ id: 5, title: 'Lab X' }],
    });
    Octokit.mockImplementationOnce(() => ({ request }));
    const result = await resolveAssignmentId('tok', 42, 'https://github.com/org/lab-x');
    expect(result).toBe(5);
  });

  test('returns the only assignment when exactly one exists', async () => {
    const request = jest.fn().mockResolvedValueOnce({
      data: [{ id: 9, title: 'Different' }],
    });
    Octokit.mockImplementationOnce(() => ({ request }));
    const result = await resolveAssignmentId('tok', 42, 'https://github.com/org/no-match');
    expect(result).toBe(9);
  });

  test('returns null on Octokit error', async () => {
    const request = jest.fn().mockRejectedValueOnce(new Error('boom'));
    Octokit.mockImplementationOnce(() => ({ request }));
    const result = await resolveAssignmentId('tok', 42, 'https://github.com/org/x');
    expect(result).toBeNull();
  });

  test('returns null when no match found among multiple', async () => {
    const request = jest.fn().mockResolvedValueOnce({
      data: [
        { id: 1, title: 'Lab A' },
        { id: 2, title: 'Lab B' },
      ],
    });
    Octokit.mockImplementationOnce(() => ({ request }));
    const result = await resolveAssignmentId('tok', 42, 'https://github.com/org/lab-c');
    expect(result).toBeNull();
  });
});

describe('createActivityRepo', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => {
    delete global.fetch;
  });

  const mockOk = (data) =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) });

  test('creates personal repo, blobs, tree, commit, and ref', async () => {
    global.fetch
      .mockReturnValueOnce(mockOk({ html_url: 'h', full_name: 'alice/repo', default_branch: 'main' }))
      .mockReturnValueOnce(mockOk({ commit: { sha: 'BASE', commit: { tree: { sha: 'TREE' } } } }))
      .mockReturnValueOnce(mockOk({ sha: 'BLOB1' }))
      .mockReturnValueOnce(mockOk({ sha: 'NEWTREE' }))
      .mockReturnValueOnce(mockOk({ sha: 'COMMIT' }))
      .mockReturnValueOnce(mockOk({}));
    const result = await createActivityRepo('tok', 'alice', 'repo', [
      { path: 'a.txt', content: 'hello' },
    ]);
    expect(result).toEqual({ repoUrl: 'h', repoFullName: 'alice/repo' });
    expect(global.fetch).toHaveBeenCalledTimes(6);
  });

  test('uses existing repo when create returns 422', async () => {
    global.fetch
      .mockReturnValueOnce(Promise.resolve({ ok: false, status: 422, json: () => Promise.resolve({}) }))
      .mockReturnValueOnce(mockOk({ html_url: 'h', full_name: 'org/repo', default_branch: 'main' }))
      .mockReturnValueOnce(mockOk({ commit: { sha: 'BASE', commit: { tree: { sha: 'TREE' } } } }))
      .mockReturnValueOnce(mockOk({ sha: 'BLOB' }))
      .mockReturnValueOnce(mockOk({ sha: 'NEWTREE' }))
      .mockReturnValueOnce(mockOk({ sha: 'COMMIT' }))
      .mockReturnValueOnce(mockOk({}));
    const result = await createActivityRepo('tok', 'alice', 'repo', [{ path: 'f', content: 'x' }], 'org');
    expect(result.repoFullName).toBe('org/repo');
  });

  test('throws when 422 fallback fetch also fails', async () => {
    global.fetch
      .mockReturnValueOnce(Promise.resolve({ ok: false, status: 422, json: () => Promise.resolve({}) }))
      .mockReturnValueOnce(Promise.resolve({ ok: false, json: () => Promise.resolve({ message: 'gone' }) }));
    await expect(
      createActivityRepo('tok', 'alice', 'r', [{ path: 'f', content: 'x' }], 'org')
    ).rejects.toThrow('gone');
  });

  test('throws when initial repo create fails with non-422', async () => {
    global.fetch.mockReturnValueOnce(
      Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ message: 'srv err' }) })
    );
    await expect(
      createActivityRepo('tok', 'alice', 'r', [{ path: 'f', content: 'x' }])
    ).rejects.toThrow('srv err');
  });

  test('throws when branch fetch fails', async () => {
    global.fetch
      .mockReturnValueOnce(mockOk({ html_url: 'h', full_name: 'o/r', default_branch: 'main' }))
      .mockReturnValueOnce(Promise.resolve({ ok: false, json: () => Promise.resolve({ message: 'no branch' }) }));
    await expect(
      createActivityRepo('tok', 'alice', 'r', [{ path: 'f', content: 'x' }])
    ).rejects.toThrow(/no branch/);
  });

  test('throws when branch has no commit tree sha', async () => {
    global.fetch
      .mockReturnValueOnce(mockOk({ html_url: 'h', full_name: 'o/r' }))
      .mockReturnValueOnce(mockOk({ commit: { sha: 'BASE', commit: {} } }));
    await expect(
      createActivityRepo('tok', 'alice', 'r', [{ path: 'f', content: 'x' }])
    ).rejects.toThrow(/not ready/);
  });

  test('throws when blob creation fails', async () => {
    global.fetch
      .mockReturnValueOnce(mockOk({ html_url: 'h', full_name: 'o/r', default_branch: 'main' }))
      .mockReturnValueOnce(mockOk({ commit: { sha: 'B', commit: { tree: { sha: 'T' } } } }))
      .mockReturnValueOnce(Promise.resolve({ ok: false, json: () => Promise.resolve({ message: 'blob bad' }) }));
    await expect(
      createActivityRepo('tok', 'alice', 'r', [{ path: 'f', content: 'x' }])
    ).rejects.toThrow(/blob bad/);
  });
});

describe('GitHubController.pushStudentCode', () => {
  const makeOctokitMock = ({ accepted, getRefImpl, getContent } = {}) => {
    const inst = {
      request: jest.fn().mockResolvedValue({ data: accepted ?? [] }),
      rest: {
        git: {
          getRef: getRefImpl || jest.fn().mockResolvedValue({
            data: { object: { sha: 'SHA' }, ref: 'refs/heads/main' },
          }),
          getCommit: jest.fn().mockResolvedValue({ data: { tree: { sha: 'TREE' } } }),
          createBlob: jest.fn().mockResolvedValue({ data: { sha: 'BLOB' } }),
          createTree: jest.fn().mockResolvedValue({ data: { sha: 'NEWTREE' } }),
          createCommit: jest.fn().mockResolvedValue({ data: { sha: 'NEWCOMMIT' } }),
          updateRef: jest.fn().mockResolvedValue({}),
        },
        repos: {
          getContent: getContent || jest.fn().mockResolvedValue({
            data: { content: Buffer.from('existing').toString('base64') },
          }),
        },
      },
    };
    Octokit.mockImplementationOnce(() => inst);
    return inst;
  };

  test('throws when no accepted assignment is found for the student', async () => {
    makeOctokitMock({ accepted: [] });
    await expect(
      GitHubController.pushStudentCode('tok', 1, 'alice', [{ name: 'a', content: 'x' }])
    ).rejects.toThrow(/No accepted assignment/);
  });

  test('pushes files and returns commit URL on success', async () => {
    makeOctokitMock({
      accepted: [
        { students: [{ login: 'alice' }], repository: { full_name: 'org/alice-1' } },
      ],
    });
    const result = await GitHubController.pushStudentCode(
      'tok', 1, 'alice', [{ name: 'main.py', content: 'print()' }]
    );
    expect(result).toEqual({
      commitUrl: 'https://github.com/org/alice-1/commit/NEWCOMMIT',
      repoUrl: 'https://github.com/org/alice-1',
    });
  });

  test('merges README grade section when gradeReadmeSection is provided', async () => {
    const inst = makeOctokitMock({
      accepted: [
        { students: [{ login: 'alice' }], repository: { full_name: 'org/alice-1' } },
      ],
    });
    await GitHubController.pushStudentCode(
      'tok', 1, 'alice',
      [{ name: 'main.py', content: 'print()' }],
      { gradeReadmeSection: '# Grade\nScore: 100' }
    );
    expect(inst.rest.repos.getContent).toHaveBeenCalled();
    expect(inst.rest.git.createBlob).toHaveBeenCalledTimes(2);
  });

  test('falls back to master when main branch is missing', async () => {
    const inst = makeOctokitMock({
      accepted: [
        { students: [{ login: 'alice' }], repository: { full_name: 'org/alice-1' } },
      ],
      getRefImpl: jest.fn()
        .mockRejectedValueOnce(new Error('no main'))
        .mockResolvedValueOnce({ data: { object: { sha: 'SHA' }, ref: 'refs/heads/master' } }),
    });
    await GitHubController.pushStudentCode('tok', 1, 'alice', [{ name: 'a', content: 'x' }]);
    expect(inst.rest.git.getRef).toHaveBeenCalledTimes(2);
  });

  test('handles missing README gracefully when grade section requested', async () => {
    makeOctokitMock({
      accepted: [
        { students: [{ login: 'alice' }], repository: { full_name: 'org/alice-1' } },
      ],
      getContent: jest.fn().mockRejectedValueOnce(new Error('not found')),
    });
    const result = await GitHubController.pushStudentCode(
      'tok', 1, 'alice', [{ name: 'a', content: 'x' }],
      { gradeReadmeSection: '# Grade' }
    );
    expect(result.commitUrl).toContain('/commit/NEWCOMMIT');
  });
});
