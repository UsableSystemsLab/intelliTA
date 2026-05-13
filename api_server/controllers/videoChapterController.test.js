jest.mock('../models/Activity.js', () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));

jest.mock('../models/VideoChapter.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    destroy: jest.fn(),
    bulkCreate: jest.fn(),
  },
}));

import Activity from '../models/Activity.js';
import VideoChapter from '../models/VideoChapter.js';
import VideoChapterController from '../controllers/videoChapterController.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('VideoChapterController.getChapters', () => {
  test('returns chapters sorted by start_time_seconds', async () => {
    const rows = [
      { id: 1, title: 'Intro', start_time_seconds: 0 },
      { id: 2, title: 'Section 1', start_time_seconds: 120 },
    ];
    VideoChapter.findAll.mockResolvedValueOnce(rows);
    const req = { params: { activityId: '5' } };
    const res = makeRes();
    await VideoChapterController.getChapters(req, res);
    expect(VideoChapter.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { activity_id: '5' } })
    );
    const { chapters } = res.json.mock.calls[0][0];
    expect(chapters).toHaveLength(2);
    expect(chapters[0]).toMatchObject({ id: 1, title: 'Intro', start_time_seconds: 0 });
  });

  test('returns empty chapters array when none exist', async () => {
    VideoChapter.findAll.mockResolvedValueOnce([]);
    const req = { params: { activityId: '5' } };
    const res = makeRes();
    await VideoChapterController.getChapters(req, res);
    expect(res.json).toHaveBeenCalledWith({ chapters: [] });
  });

  test('returns 500 on database error', async () => {
    VideoChapter.findAll.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { activityId: '5' } };
    const res = makeRes();
    await VideoChapterController.getChapters(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('VideoChapterController.setChapters', () => {
  test('returns 400 when chapters is not an array', async () => {
    const req = { params: { activityId: '5' }, body: { chapters: 'invalid' } };
    const res = makeRes();
    await VideoChapterController.setChapters(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'chapters must be an array' });
  });

  test('returns 404 when activity is not found', async () => {
    Activity.findOne.mockResolvedValueOnce(null);
    const req = { params: { activityId: '99' }, body: { chapters: [] } };
    const res = makeRes();
    await VideoChapterController.setChapters(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Activity not found' });
  });

  test('deletes all chapters and returns empty array when chapters is []', async () => {
    Activity.findOne.mockResolvedValueOnce({ activity_id: 5 });
    VideoChapter.destroy.mockResolvedValueOnce(2);
    const req = { params: { activityId: '5' }, body: { chapters: [] } };
    const res = makeRes();
    await VideoChapterController.setChapters(req, res);
    expect(VideoChapter.destroy).toHaveBeenCalledWith({ where: { activity_id: '5' } });
    expect(res.json).toHaveBeenCalledWith({ chapters: [] });
  });

  test('atomically replaces chapters and returns 201', async () => {
    const incoming = [
      { title: 'Intro', start_time_seconds: 0 },
      { title: 'Main Topic', start_time_seconds: 90 },
    ];
    const created = [
      { id: 10, title: 'Intro', start_time_seconds: 0 },
      { id: 11, title: 'Main Topic', start_time_seconds: 90 },
    ];
    Activity.findOne.mockResolvedValueOnce({ activity_id: 5 });
    VideoChapter.destroy.mockResolvedValueOnce(0);
    VideoChapter.bulkCreate.mockResolvedValueOnce(created);
    const req = { params: { activityId: '5' }, body: { chapters: incoming } };
    const res = makeRes();
    await VideoChapterController.setChapters(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    const { chapters } = res.json.mock.calls[0][0];
    expect(chapters).toHaveLength(2);
    expect(chapters[0]).toMatchObject({ id: 10, title: 'Intro', start_time_seconds: 0 });
  });

  test('returns 500 on database error', async () => {
    Activity.findOne.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { activityId: '5' }, body: { chapters: [] } };
    const res = makeRes();
    await VideoChapterController.setChapters(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('VideoChapterController.deleteChapter', () => {
  test('returns 404 when chapter is not found', async () => {
    VideoChapter.findByPk.mockResolvedValueOnce(null);
    const req = { params: { chapterId: '99' } };
    const res = makeRes();
    await VideoChapterController.deleteChapter(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Chapter not found' });
  });

  test('deletes chapter and returns 204', async () => {
    const chapter = { id: 1, destroy: jest.fn().mockResolvedValueOnce(undefined) };
    VideoChapter.findByPk.mockResolvedValueOnce(chapter);
    const req = { params: { chapterId: '1' } };
    const res = makeRes();
    await VideoChapterController.deleteChapter(req, res);
    expect(chapter.destroy).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  test('returns 500 on database error', async () => {
    VideoChapter.findByPk.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { chapterId: '1' } };
    const res = makeRes();
    await VideoChapterController.deleteChapter(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
