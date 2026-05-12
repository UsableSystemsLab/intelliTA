jest.mock('../models/User.js', () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));

jest.mock('../models/QuizQuestion.js', () => ({
  __esModule: true,
  default: { findByPk: jest.fn() },
}));

jest.mock('../models/StudentAnswer.js', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findAll: jest.fn(),
  },
}));

import User from '../models/User.js';
import QuizQuestion from '../models/QuizQuestion.js';
import StudentAnswer from '../models/StudentAnswer.js';
import StudentAnswerController from '../controllers/studentAnswerController.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('StudentAnswerController.recordAnswer', () => {
  test('returns 400 when required fields are missing', async () => {
    const req = { params: { activityId: '1' }, body: { firebaseId: 'fb1' } };
    const res = makeRes();
    await StudentAnswerController.recordAnswer(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('required') })
    );
  });

  test('returns 404 when user is not found', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const req = { params: { activityId: '1' }, body: { firebaseId: 'fb_unknown', question_id: 1, answer: 'A' } };
    const res = makeRes();
    await StudentAnswerController.recordAnswer(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  test('returns 404 when question is not found', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    QuizQuestion.findByPk.mockResolvedValueOnce(null);
    const req = { params: { activityId: '1' }, body: { firebaseId: 'fb1', question_id: 99, answer: 'A' } };
    const res = makeRes();
    await StudentAnswerController.recordAnswer(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Question not found' });
  });

  test('records a correct MCQ answer and returns 201 with is_correct: true', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    QuizQuestion.findByPk.mockResolvedValueOnce({ type: 'mcq', correct_answer: 2 });
    StudentAnswer.create.mockResolvedValueOnce({});
    const req = { params: { activityId: '1' }, body: { firebaseId: 'fb1', question_id: 5, answer: 2 } };
    const res = makeRes();
    await StudentAnswerController.recordAnswer(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ is_correct: true });
  });

  test('records an incorrect MCQ answer and returns 201 with is_correct: false', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    QuizQuestion.findByPk.mockResolvedValueOnce({ type: 'mcq', correct_answer: 2 });
    StudentAnswer.create.mockResolvedValueOnce({});
    const req = { params: { activityId: '1' }, body: { firebaseId: 'fb1', question_id: 5, answer: 1 } };
    const res = makeRes();
    await StudentAnswerController.recordAnswer(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ is_correct: false });
  });

  test('verifies fill_blank answer case-insensitively and trims whitespace', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    QuizQuestion.findByPk.mockResolvedValueOnce({ type: 'fill_blank', correct_answer: 'Python' });
    StudentAnswer.create.mockResolvedValueOnce({});
    const req = { params: { activityId: '1' }, body: { firebaseId: 'fb1', question_id: 6, answer: '  PYTHON  ' } };
    const res = makeRes();
    await StudentAnswerController.recordAnswer(req, res);
    expect(res.json).toHaveBeenCalledWith({ is_correct: true });
  });

  test('marks fill_blank as incorrect when content differs', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    QuizQuestion.findByPk.mockResolvedValueOnce({ type: 'fill_blank', correct_answer: 'Python' });
    StudentAnswer.create.mockResolvedValueOnce({});
    const req = { params: { activityId: '1' }, body: { firebaseId: 'fb1', question_id: 6, answer: 'Java' } };
    const res = makeRes();
    await StudentAnswerController.recordAnswer(req, res);
    expect(res.json).toHaveBeenCalledWith({ is_correct: false });
  });

  test('verifies true_false answer by strict equality', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    QuizQuestion.findByPk.mockResolvedValueOnce({ type: 'true_false', correct_answer: true });
    StudentAnswer.create.mockResolvedValueOnce({});
    const req = { params: { activityId: '1' }, body: { firebaseId: 'fb1', question_id: 7, answer: true } };
    const res = makeRes();
    await StudentAnswerController.recordAnswer(req, res);
    expect(res.json).toHaveBeenCalledWith({ is_correct: true });
  });

  test('returns 500 on database error', async () => {
    User.findOne.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { activityId: '1' }, body: { firebaseId: 'fb1', question_id: 1, answer: 'X' } };
    const res = makeRes();
    await StudentAnswerController.recordAnswer(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('StudentAnswerController.getAnswers', () => {
  test('returns 400 when firebaseId is missing', async () => {
    const req = { params: { activityId: '1' }, query: {} };
    const res = makeRes();
    await StudentAnswerController.getAnswers(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'firebaseId is required' });
  });

  test('returns 404 when user is not found', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const req = { params: { activityId: '1' }, query: { firebaseId: 'fb_unknown' } };
    const res = makeRes();
    await StudentAnswerController.getAnswers(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 with user answers', async () => {
    const answers = [{ id: 1, answer: 2, is_correct: true }];
    User.findOne.mockResolvedValueOnce({ id: 1 });
    StudentAnswer.findAll.mockResolvedValueOnce(answers);
    const req = { params: { activityId: '1' }, query: { firebaseId: 'fb1' } };
    const res = makeRes();
    await StudentAnswerController.getAnswers(req, res);
    expect(res.json).toHaveBeenCalledWith({ answers });
  });

  test('returns 500 on database error', async () => {
    User.findOne.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { activityId: '1' }, query: { firebaseId: 'fb1' } };
    const res = makeRes();
    await StudentAnswerController.getAnswers(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
