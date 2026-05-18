jest.mock('../models/User.js', () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));

jest.mock('../models/Activity.js', () => ({
  __esModule: true,
  default: { findByPk: jest.fn() },
}));

jest.mock('../models/VideoProgress.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findOrCreate: jest.fn(),
  },
}));

import User from '../models/User.js';
import Activity from '../models/Activity.js';
import VideoProgress from '../models/VideoProgress.js';
import VideoProgressController from '../controllers/videoProgressController.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('VideoProgressController.getProgress', () => {
  test('returns 400 when firebaseId is missing', async () => {
    const req = { params: { activityId: '1' }, query: {} };
    const res = makeRes();
    await VideoProgressController.getProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'firebaseId is required' });
  });

  test('returns 404 when user is not found', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const req = { params: { activityId: '1' }, query: { firebaseId: 'fb_unknown' } };
    const res = makeRes();
    await VideoProgressController.getProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  test('returns last_watched_seconds when progress record exists', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    VideoProgress.findOne.mockResolvedValueOnce({ last_watched_seconds: 245 });
    const req = { params: { activityId: '3' }, query: { firebaseId: 'fb1' } };
    const res = makeRes();
    await VideoProgressController.getProgress(req, res);
    expect(VideoProgress.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user_id: 1, activity_id: '3' } })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ last_watched_seconds: 245 })
    );
  });

  test('returns 0 when no progress record exists yet', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    VideoProgress.findOne.mockResolvedValueOnce(null);
    const req = { params: { activityId: '3' }, query: { firebaseId: 'fb1' } };
    const res = makeRes();
    await VideoProgressController.getProgress(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ last_watched_seconds: 0 })
    );
  });

  test('returns 500 on database error', async () => {
    User.findOne.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { activityId: '1' }, query: { firebaseId: 'fb1' } };
    const res = makeRes();
    await VideoProgressController.getProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('VideoProgressController.upsertProgress', () => {
  test('returns 400 when firebaseId is missing', async () => {
    const req = { params: { activityId: '1' }, body: { last_watched_seconds: 100 } };
    const res = makeRes();
    await VideoProgressController.upsertProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'firebaseId is required' });
  });

  test('returns 400 when last_watched_seconds is missing', async () => {
    const req = { params: { activityId: '1' }, body: { firebaseId: 'fb1' } };
    const res = makeRes();
    await VideoProgressController.upsertProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'last_watched_seconds is required' });
  });

  test('returns 400 when last_watched_seconds is null', async () => {
    const req = { params: { activityId: '1' }, body: { firebaseId: 'fb1', last_watched_seconds: null } };
    const res = makeRes();
    await VideoProgressController.upsertProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when user is not found', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const req = { params: { activityId: '1' }, body: { firebaseId: 'fb_unknown', last_watched_seconds: 60 } };
    const res = makeRes();
    await VideoProgressController.upsertProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('creates a new progress record and returns the seconds', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    VideoProgress.findOrCreate.mockResolvedValueOnce([{ last_watched_seconds: 300 }, true]);
    const req = { params: { activityId: '3' }, body: { firebaseId: 'fb1', last_watched_seconds: 300 } };
    const res = makeRes();
    await VideoProgressController.upsertProgress(req, res);
    expect(VideoProgress.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user_id: 1, activity_id: '3' }, defaults: { last_watched_seconds: 300 } })
    );
    expect(res.json).toHaveBeenCalledWith({ last_watched_seconds: 300 });
  });

  test('updates existing progress record and returns the seconds', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    const record = { last_watched_seconds: 200, update: jest.fn().mockResolvedValueOnce(undefined) };
    VideoProgress.findOrCreate.mockResolvedValueOnce([record, false]);
    const req = { params: { activityId: '3' }, body: { firebaseId: 'fb1', last_watched_seconds: 450 } };
    const res = makeRes();
    await VideoProgressController.upsertProgress(req, res);
    expect(record.update).toHaveBeenCalledWith(
      expect.objectContaining({ last_watched_seconds: 450 })
    );
    expect(res.json).toHaveBeenCalledWith({ last_watched_seconds: 450 });
  });

  test('returns 500 on database error', async () => {
    User.findOne.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { activityId: '1' }, body: { firebaseId: 'fb1', last_watched_seconds: 10 } };
    const res = makeRes();
    await VideoProgressController.upsertProgress(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('VideoProgressController.acknowledgeUpdate', () => {
  test('returns 400 when firebaseId is missing', async () => {
    const req = { params: { activityId: '1' }, body: {} };
    const res = makeRes();
    await VideoProgressController.acknowledgeUpdate(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'firebaseId is required' });
  });

  test('returns 404 when user is not found', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const req = { params: { activityId: '1' }, body: { firebaseId: 'fb_unknown' } };
    const res = makeRes();
    await VideoProgressController.acknowledgeUpdate(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  test('returns 404 when activity is not found', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    Activity.findByPk.mockResolvedValueOnce(null);
    const req = { params: { activityId: '99' }, body: { firebaseId: 'fb1' } };
    const res = makeRes();
    await VideoProgressController.acknowledgeUpdate(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Activity not found' });
  });

  test('creates a record and uses activity.content_updated_at when present', async () => {
    const ackTime = new Date('2025-01-01T00:00:00Z');
    User.findOne.mockResolvedValueOnce({ id: 1 });
    Activity.findByPk.mockResolvedValueOnce({ content_updated_at: ackTime });
    VideoProgress.findOrCreate.mockResolvedValueOnce([{}, true]);
    const req = { params: { activityId: '3' }, body: { firebaseId: 'fb1' } };
    const res = makeRes();
    await VideoProgressController.acknowledgeUpdate(req, res);
    expect(VideoProgress.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: 1, activity_id: '3' },
        defaults: expect.objectContaining({ last_seen_content_updated_at: ackTime }),
      })
    );
    expect(res.json).toHaveBeenCalledWith({ last_seen_content_updated_at: ackTime });
  });

  test('updates existing record when not created', async () => {
    const ackTime = new Date('2025-02-02T00:00:00Z');
    User.findOne.mockResolvedValueOnce({ id: 1 });
    Activity.findByPk.mockResolvedValueOnce({ content_updated_at: ackTime });
    const record = { update: jest.fn().mockResolvedValueOnce(undefined) };
    VideoProgress.findOrCreate.mockResolvedValueOnce([record, false]);
    const req = { params: { activityId: '3' }, body: { firebaseId: 'fb1' } };
    const res = makeRes();
    await VideoProgressController.acknowledgeUpdate(req, res);
    expect(record.update).toHaveBeenCalledWith({ last_seen_content_updated_at: ackTime });
    expect(res.json).toHaveBeenCalledWith({ last_seen_content_updated_at: ackTime });
  });

  test('falls back to now when activity has no content_updated_at', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    Activity.findByPk.mockResolvedValueOnce({ content_updated_at: null });
    VideoProgress.findOrCreate.mockResolvedValueOnce([{}, true]);
    const req = { params: { activityId: '3' }, body: { firebaseId: 'fb1' } };
    const res = makeRes();
    await VideoProgressController.acknowledgeUpdate(req, res);
    const payload = res.json.mock.calls[0][0];
    expect(payload.last_seen_content_updated_at).toBeInstanceOf(Date);
  });

  test('returns 500 on database error', async () => {
    User.findOne.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { activityId: '1' }, body: { firebaseId: 'fb1' } };
    const res = makeRes();
    await VideoProgressController.acknowledgeUpdate(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
