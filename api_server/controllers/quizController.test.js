jest.mock('../models/Activity.js', () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));

jest.mock('../models/QuizQuestion.js', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    destroy: jest.fn(),
    bulkCreate: jest.fn(),
  },
}));

import Activity from '../models/Activity.js';
import QuizQuestion from '../models/QuizQuestion.js';
import QuizController from '../controllers/quizController.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('QuizController.getQuiz', () => {
  test('returns quiz questions for an activity', async () => {
    const rows = [
      { id: 1, time_seconds: 30, type: 'mcq', question: 'Q1?', correct_answer: 0, options: ['A', 'B'] },
    ];
    QuizQuestion.findAll.mockResolvedValueOnce(rows);
    const req = { params: { activityId: '5' } };
    const res = makeRes();
    await QuizController.getQuiz(req, res);
    expect(QuizQuestion.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { activity_id: '5' } })
    );
    const { quizzes } = res.json.mock.calls[0][0];
    expect(quizzes).toHaveLength(1);
    expect(quizzes[0]).toMatchObject({ id: 1, type: 'mcq', question: 'Q1?', options: ['A', 'B'] });
  });

  test('returns empty quizzes array when no questions exist', async () => {
    QuizQuestion.findAll.mockResolvedValueOnce([]);
    const req = { params: { activityId: '5' } };
    const res = makeRes();
    await QuizController.getQuiz(req, res);
    expect(res.json).toHaveBeenCalledWith({ quizzes: [] });
  });

  test('maps coding question fields correctly', async () => {
    const rows = [
      { id: 2, time_seconds: 60, type: 'coding', title: 'Write FizzBuzz', instruction: 'Do it', file_name: 'main.py', check_regex: 'FizzBuzz' },
    ];
    QuizQuestion.findAll.mockResolvedValueOnce(rows);
    const req = { params: { activityId: '7' } };
    const res = makeRes();
    await QuizController.getQuiz(req, res);
    const { quizzes } = res.json.mock.calls[0][0];
    expect(quizzes[0]).toMatchObject({
      id: 2, type: 'coding', title: 'Write FizzBuzz',
      instruction: 'Do it', fileName: 'main.py', check: 'FizzBuzz',
    });
    expect(quizzes[0]).not.toHaveProperty('question');
  });

  test('maps true_false question without options field', async () => {
    const rows = [
      { id: 3, time_seconds: 10, type: 'true_false', question: 'Is sky blue?', correct_answer: true },
    ];
    QuizQuestion.findAll.mockResolvedValueOnce(rows);
    const req = { params: { activityId: '8' } };
    const res = makeRes();
    await QuizController.getQuiz(req, res);
    const { quizzes } = res.json.mock.calls[0][0];
    expect(quizzes[0]).toMatchObject({ type: 'true_false', correctAnswer: true });
    expect(quizzes[0]).not.toHaveProperty('options');
  });

  test('returns 500 on database error', async () => {
    QuizQuestion.findAll.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { activityId: '5' } };
    const res = makeRes();
    await QuizController.getQuiz(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('QuizController.setQuiz', () => {
  test('returns 400 when quizzes is not an array', async () => {
    const req = { params: { activityId: '5' }, body: { quizzes: 'invalid' } };
    const res = makeRes();
    await QuizController.setQuiz(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'quizzes must be an array' });
  });

  test('returns 404 when activity does not exist', async () => {
    Activity.findOne.mockResolvedValueOnce(null);
    const req = { params: { activityId: '99' }, body: { quizzes: [] } };
    const res = makeRes();
    await QuizController.setQuiz(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Activity not found' });
  });

  test('deletes all questions and returns empty array when quizzes is []', async () => {
    Activity.findOne.mockResolvedValueOnce({ activity_id: 5 });
    QuizQuestion.destroy.mockResolvedValueOnce(3);
    const req = { params: { activityId: '5' }, body: { quizzes: [] } };
    const res = makeRes();
    await QuizController.setQuiz(req, res);
    expect(QuizQuestion.destroy).toHaveBeenCalledWith({ where: { activity_id: '5' } });
    expect(res.json).toHaveBeenCalledWith({ quizzes: [] });
  });

  test('replaces all questions and returns 201 with new quizzes', async () => {
    const incoming = [
      { time: 15, type: 'mcq', question: 'What?', options: ['A', 'B'], correctAnswer: 0 },
    ];
    const created = [
      { id: 10, time_seconds: 15, type: 'mcq', question: 'What?', correct_answer: 0, options: ['A', 'B'] },
    ];
    Activity.findOne.mockResolvedValueOnce({ activity_id: 5 });
    QuizQuestion.destroy.mockResolvedValueOnce(0);
    QuizQuestion.bulkCreate.mockResolvedValueOnce(created);
    const req = { params: { activityId: '5' }, body: { quizzes: incoming } };
    const res = makeRes();
    await QuizController.setQuiz(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    const { quizzes } = res.json.mock.calls[0][0];
    expect(quizzes).toHaveLength(1);
    expect(quizzes[0]).toMatchObject({ id: 10, type: 'mcq', question: 'What?' });
  });

  test('returns 500 on database error', async () => {
    Activity.findOne.mockRejectedValueOnce(new Error('db error'));
    const req = { params: { activityId: '5' }, body: { quizzes: [] } };
    const res = makeRes();
    await QuizController.setQuiz(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
