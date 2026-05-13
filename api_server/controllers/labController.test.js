jest.mock('../models/index.js', () => ({
  __esModule: true,
  Lab: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  Course: {
    findByPk: jest.fn(),
  },
}));

import { Lab, Course } from '../models/index.js';
import LabController from '../controllers/labController.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('LabController.createLab', () => {
  test('returns 404 when course is not found', async () => {
    Course.findByPk.mockResolvedValueOnce(null);
    const req = { params: { courseId: '99' }, body: { title: 'Lab 1', type: 'markdown', markdown_text: '# Hello' }, file: null };
    const res = makeRes();
    await LabController.createLab(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Course not found' });
  });

  test('returns 400 when type is video but no file is uploaded', async () => {
    Course.findByPk.mockResolvedValueOnce({ course_id: 1 });
    const req = { params: { courseId: '1' }, body: { title: 'Lab 1', type: 'video' }, file: null };
    const res = makeRes();
    await LabController.createLab(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Video file is required for video labs' });
  });

  test('creates a markdown lab and returns 201', async () => {
    const newLab = { lab_id: 1, title: 'Lab 1', type: 'markdown' };
    Course.findByPk.mockResolvedValueOnce({ course_id: 1 });
    Lab.create.mockResolvedValueOnce(newLab);
    const req = { params: { courseId: '1' }, body: { title: 'Lab 1', type: 'markdown', markdown_text: '# Hello' }, file: null };
    const res = makeRes();
    await LabController.createLab(req, res);
    expect(Lab.create).toHaveBeenCalledWith(
      expect.objectContaining({ course_id: '1', title: 'Lab 1', type: 'markdown', video_url: null })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(newLab);
  });

  test('creates a video lab using the file location from S3', async () => {
    const newLab = { lab_id: 2, title: 'Video Lab', type: 'video', video_url: 'https://s3.example.com/video.mp4' };
    Course.findByPk.mockResolvedValueOnce({ course_id: 1 });
    Lab.create.mockResolvedValueOnce(newLab);
    const req = {
      params: { courseId: '1' },
      body: { title: 'Video Lab', type: 'video' },
      file: { location: 'https://s3.example.com/video.mp4' },
    };
    const res = makeRes();
    await LabController.createLab(req, res);
    expect(Lab.create).toHaveBeenCalledWith(
      expect.objectContaining({ video_url: 'https://s3.example.com/video.mp4', markdown_text: null })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('returns 400 on database error', async () => {
    Course.findByPk.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { courseId: '1' }, body: { title: 'Lab', type: 'markdown' }, file: null };
    const res = makeRes();
    await LabController.createLab(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('LabController.getLabsByCourse', () => {
  test('returns 200 with all labs for a course', async () => {
    const labs = [{ lab_id: 1 }, { lab_id: 2 }];
    Lab.findAll.mockResolvedValueOnce(labs);
    const req = { params: { courseId: '1' } };
    const res = makeRes();
    await LabController.getLabsByCourse(req, res);
    expect(Lab.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { course_id: '1' } })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(labs);
  });

  test('returns empty array when no labs exist for the course', async () => {
    Lab.findAll.mockResolvedValueOnce([]);
    const req = { params: { courseId: '99' } };
    const res = makeRes();
    await LabController.getLabsByCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('returns 500 on database error', async () => {
    Lab.findAll.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { courseId: '1' } };
    const res = makeRes();
    await LabController.getLabsByCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('LabController.getLabById', () => {
  test('returns 200 with lab when found', async () => {
    const lab = { lab_id: 1, title: 'Lab 1' };
    Lab.findByPk.mockResolvedValueOnce(lab);
    const req = { params: { labId: '1' } };
    const res = makeRes();
    await LabController.getLabById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(lab);
  });

  test('returns 404 when lab is not found', async () => {
    Lab.findByPk.mockResolvedValueOnce(null);
    const req = { params: { labId: '99' } };
    const res = makeRes();
    await LabController.getLabById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Lab not found' });
  });

  test('returns 500 on database error', async () => {
    Lab.findByPk.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { labId: '1' } };
    const res = makeRes();
    await LabController.getLabById(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('LabController.updateLab', () => {
  test('returns 200 with updated lab', async () => {
    const updated = { lab_id: 1, title: 'Updated' };
    Lab.update.mockResolvedValueOnce([1]);
    Lab.findByPk.mockResolvedValueOnce(updated);
    const req = { params: { labId: '1' }, body: { title: 'Updated' } };
    const res = makeRes();
    await LabController.updateLab(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  test('returns 404 when lab is not found', async () => {
    Lab.update.mockResolvedValueOnce([0]);
    const req = { params: { labId: '99' }, body: {} };
    const res = makeRes();
    await LabController.updateLab(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Lab not found' });
  });

  test('returns 400 on database error', async () => {
    Lab.update.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { labId: '1' }, body: {} };
    const res = makeRes();
    await LabController.updateLab(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('LabController.deleteLab', () => {
  test('returns 204 when lab is deleted', async () => {
    Lab.destroy.mockResolvedValueOnce(1);
    const req = { params: { labId: '1' } };
    const res = makeRes();
    await LabController.deleteLab(req, res);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  test('returns 404 when lab is not found', async () => {
    Lab.destroy.mockResolvedValueOnce(0);
    const req = { params: { labId: '99' } };
    const res = makeRes();
    await LabController.deleteLab(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Lab not found' });
  });

  test('returns 500 on database error', async () => {
    Lab.destroy.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { labId: '1' } };
    const res = makeRes();
    await LabController.deleteLab(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
