jest.mock('../models/index.js', () => ({
  __esModule: true,
  User: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));

jest.mock('../configs/s3.js', () => ({
  __esModule: true,
  S3_PUBLIC_URL: 'https://s3.example.com',
  S3_BUCKET: 'test-bucket',
}));

import { User } from '../models/index.js';
import UserController from '../controllers/UserController.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('UserController.createUser', () => {
  test('creates a user and returns 201', async () => {
    const newUser = { id: 1, firebaseId: 'fb1', email: 'a@kau.edu.sa' };
    User.create.mockResolvedValueOnce(newUser);
    const req = { body: { firebaseId: 'fb1', first_name: 'Ali', last_name: 'S', email: 'a@kau.edu.sa' } };
    const res = makeRes();
    await UserController.createUser(req, res);
    expect(User.create).toHaveBeenCalledWith({
      firebaseId: 'fb1', first_name: 'Ali', last_name: 'S', email: 'a@kau.edu.sa',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(newUser);
  });

  test('returns 400 when create throws', async () => {
    User.create.mockRejectedValueOnce(new Error('unique violation'));
    const req = { body: {} };
    const res = makeRes();
    await UserController.createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Error creating user' })
    );
  });
});

describe('UserController.getAllUsers', () => {
  test('returns 200 with all users', async () => {
    const users = [{ id: 1 }, { id: 2 }];
    User.findAll.mockResolvedValueOnce(users);
    const res = makeRes();
    await UserController.getAllUsers({}, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(users);
  });

  test('returns 500 on database error', async () => {
    User.findAll.mockRejectedValueOnce(new Error('db error'));
    const res = makeRes();
    await UserController.getAllUsers({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('UserController.getUserById', () => {
  test('returns 200 with user when found', async () => {
    const user = { id: 5, email: 'u@kau.edu.sa' };
    User.findByPk.mockResolvedValueOnce(user);
    const req = { params: { id: '5' } };
    const res = makeRes();
    await UserController.getUserById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(user);
  });

  test('returns 404 when user is not found', async () => {
    User.findByPk.mockResolvedValueOnce(null);
    const req = { params: { id: '99' } };
    const res = makeRes();
    await UserController.getUserById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  test('returns 500 on database error', async () => {
    User.findByPk.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { id: '1' } };
    const res = makeRes();
    await UserController.getUserById(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('UserController.updateUser', () => {
  test('returns 200 with updated user when found', async () => {
    const updated = { id: 1, first_name: 'New' };
    User.update.mockResolvedValueOnce([1]);
    User.findByPk.mockResolvedValueOnce(updated);
    const req = { params: { id: '1' }, body: { first_name: 'New' } };
    const res = makeRes();
    await UserController.updateUser(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  test('returns 404 when user is not found', async () => {
    User.update.mockResolvedValueOnce([0]);
    const req = { params: { id: '99' }, body: {} };
    const res = makeRes();
    await UserController.updateUser(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 400 when update throws', async () => {
    User.update.mockRejectedValueOnce(new Error('bad update'));
    const req = { params: { id: '1' }, body: {} };
    const res = makeRes();
    await UserController.updateUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('UserController.deleteUser', () => {
  test('returns 204 when user is deleted', async () => {
    User.destroy.mockResolvedValueOnce(1);
    const req = { params: { id: '1' } };
    const res = makeRes();
    await UserController.deleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  test('returns 404 when user is not found', async () => {
    User.destroy.mockResolvedValueOnce(0);
    const req = { params: { id: '99' } };
    const res = makeRes();
    await UserController.deleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 500 when destroy throws', async () => {
    User.destroy.mockRejectedValueOnce(new Error('db down'));
    const req = { params: { id: '1' } };
    const res = makeRes();
    await UserController.deleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('UserController.deactivateAccount', () => {
  test('returns 200 when account is deactivated', async () => {
    User.update.mockResolvedValueOnce([1]);
    const req = { params: { firebaseUid: 'fb1' } };
    const res = makeRes();
    await UserController.deactivateAccount(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Account deactivated successfully' });
  });

  test('returns 404 when user is not found or already deactivated', async () => {
    User.update.mockResolvedValueOnce([0]);
    const req = { params: { firebaseUid: 'fb_unknown' } };
    const res = makeRes();
    await UserController.deactivateAccount(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 500 when update throws', async () => {
    User.update.mockRejectedValueOnce(new Error('db down'));
    const req = { params: { firebaseUid: 'fb1' } };
    const res = makeRes();
    await UserController.deactivateAccount(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('UserController.uploadAvatar', () => {
  test('returns 400 when no file is uploaded', async () => {
    const req = { file: null, params: { firebaseUid: 'fb1' } };
    const res = makeRes();
    await UserController.uploadAvatar(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'No file uploaded' });
  });

  test('builds URL from S3_PUBLIC_URL and updates user photo', async () => {
    User.update.mockResolvedValueOnce([1]);
    const req = {
      file: { key: 'avatars/fb1.jpg', location: 'http://ignored' },
      params: { firebaseUid: 'fb1' },
    };
    const res = makeRes();
    await UserController.uploadAvatar(req, res);
    expect(User.update).toHaveBeenCalledWith(
      { photo_url: 'https://s3.example.com/test-bucket/avatars/fb1.jpg' },
      { where: { firebaseId: 'fb1' } }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ photoURL: 'https://s3.example.com/test-bucket/avatars/fb1.jpg' })
    );
  });
});

describe('UserController.getProfile', () => {
  test('returns 200 with profile when user is found', async () => {
    const profile = { bio: 'Hello', first_name: 'Ali' };
    User.findOne.mockResolvedValueOnce(profile);
    const req = { params: { firebaseUid: 'fb1' } };
    const res = makeRes();
    await UserController.getProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(profile);
  });

  test('returns 404 when user is not found', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const req = { params: { firebaseUid: 'fb_unknown' } };
    const res = makeRes();
    await UserController.getProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 500 when findOne throws', async () => {
    User.findOne.mockRejectedValueOnce(new Error('db down'));
    const req = { params: { firebaseUid: 'fb1' } };
    const res = makeRes();
    await UserController.getProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('UserController.updateProfile', () => {
  const profile = {
    bio: 'Updated', first_name: 'New', last_name: 'Name',
    github_username: null, github_verified: false,
  };

  test('returns 200 with updated profile', async () => {
    User.update.mockResolvedValueOnce([1]);
    User.findOne.mockResolvedValueOnce(profile);
    const req = { params: { firebaseUid: 'fb1' }, body: { bio: 'Updated', first_name: 'New', last_name: 'Name' } };
    const res = makeRes();
    await UserController.updateProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(profile);
  });

  test('resets github_verified to false when github_username is updated', async () => {
    User.update.mockResolvedValueOnce([1]);
    User.findOne.mockResolvedValueOnce(profile);
    const req = { params: { firebaseUid: 'fb1' }, body: { github_username: 'newuser' } };
    const res = makeRes();
    await UserController.updateProfile(req, res);
    expect(User.update).toHaveBeenCalledWith(
      expect.objectContaining({ github_username: 'newuser', github_verified: false }),
      expect.any(Object)
    );
  });

  test('returns 404 when user is not found', async () => {
    User.update.mockResolvedValueOnce([0]);
    const req = { params: { firebaseUid: 'fb_unknown' }, body: { bio: 'x' } };
    const res = makeRes();
    await UserController.updateProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 400 when update throws', async () => {
    User.update.mockRejectedValueOnce(new Error('bad update'));
    const req = { params: { firebaseUid: 'fb1' }, body: { bio: 'x' } };
    const res = makeRes();
    await UserController.updateProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
