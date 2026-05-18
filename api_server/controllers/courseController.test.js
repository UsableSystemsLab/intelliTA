jest.mock('sequelize', () => ({
  __esModule: true,
  Op: { ne: Symbol('Op.ne') },
  DataTypes: {},
}));

jest.mock('../models/index.js', () => ({
  __esModule: true,
  Course: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  Lab: {},
  Enrollment: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
  },
}));

import { Course, User, Enrollment } from '../models/index.js';
import CourseController from '../controllers/courseController.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('CourseController.createCourse', () => {
  test('returns 400 when firebaseId is missing', async () => {
    const req = { body: { title: 'Test' } };
    const res = makeRes();
    await CourseController.createCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'firebaseId is required' });
  });

  test('returns 404 when user is not found', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const req = { body: { firebaseId: 'fb_unknown', title: 'Test' } };
    const res = makeRes();
    await CourseController.createCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('creates course and returns 201', async () => {
    const user = { id: 1 };
    const course = { course_id: 10, title: 'Test', token: 'ABC123' };
    User.findOne.mockResolvedValueOnce(user);
    Course.findOne.mockResolvedValueOnce(null); 
    Course.create.mockResolvedValueOnce(course);
    Course.findByPk.mockResolvedValueOnce({ ...course, instructor: user });
    const req = { body: { firebaseId: 'fb1', title: 'Test', course_code: 'CS101' } };
    const res = makeRes();
    await CourseController.createCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('returns 400 on unexpected error', async () => {
    User.findOne.mockRejectedValueOnce(new Error('db error'));
    const req = { body: { firebaseId: 'fb1', title: 'Test' } };
    const res = makeRes();
    await CourseController.createCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('CourseController.joinCourse', () => {
  test('returns 400 when token is missing', async () => {
    const req = { body: { firebaseId: 'fb1' } };
    const res = makeRes();
    await CourseController.joinCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when user is not found', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const req = { body: { token: 'ABC123', firebaseId: 'fb_unknown' } };
    const res = makeRes();
    await CourseController.joinCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  test('returns 404 when course token is invalid', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    Course.findOne.mockResolvedValueOnce(null);
    const req = { body: { token: 'BADTOK', firebaseId: 'fb1' } };
    const res = makeRes();
    await CourseController.joinCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid course token' });
  });

  test('returns 400 when instructor tries to join their own course', async () => {
    User.findOne.mockResolvedValueOnce({ id: 5 });
    Course.findOne.mockResolvedValueOnce({ course_id: 1, instructor_id: 5 });
    const req = { body: { token: 'MYTKN', firebaseId: 'fb_instructor' } };
    const res = makeRes();
    await CourseController.joinCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'You cannot join a course you created.' });
  });

  test('returns 400 when user is already enrolled', async () => {
    User.findOne.mockResolvedValueOnce({ id: 2 });
    Course.findOne.mockResolvedValueOnce({ course_id: 1, instructor_id: 99 });
    Enrollment.findOne.mockResolvedValueOnce({ enrollment_id: 10 });
    const req = { body: { token: 'TOKN01', firebaseId: 'fb2' } };
    const res = makeRes();
    await CourseController.joinCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'You are already enrolled in this course' });
  });

  test('returns 403 when course requires name selection and none was provided', async () => {
    User.findOne.mockResolvedValueOnce({ id: 2 });
    Course.findOne.mockResolvedValueOnce({
      course_id: 1, instructor_id: 99,
      allowed_students: ['Alice', 'Bob'],
    });
    Enrollment.findOne.mockResolvedValueOnce(null);
    Enrollment.findAll.mockResolvedValueOnce([]);
    const req = { body: { token: 'TOKN01', firebaseId: 'fb2' } };
    const res = makeRes();
    await CourseController.joinCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ requires_name_selection: true, available_names: ['Alice', 'Bob'] })
    );
  });

  test('returns 400 when selected name is already taken', async () => {
    User.findOne.mockResolvedValueOnce({ id: 3 });
    Course.findOne.mockResolvedValueOnce({
      course_id: 1, instructor_id: 99,
      allowed_students: ['Alice', 'Bob'],
    });
    Enrollment.findOne.mockResolvedValueOnce(null);
    Enrollment.findAll.mockResolvedValueOnce([{ enrolled_name: 'Alice' }]);
    const req = { body: { token: 'TOKN01', firebaseId: 'fb3', selected_name: 'Alice' } };
    const res = makeRes();
    await CourseController.joinCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('enrolls student and returns 200', async () => {
    const user = { id: 4, email: 'stu@stu.kau.edu.sa' };
    const course = { course_id: 1, instructor_id: 99, allowed_students: null };
    User.findOne.mockResolvedValueOnce(user);
    Course.findOne.mockResolvedValueOnce(course);
    Enrollment.findOne.mockResolvedValueOnce(null);
    Enrollment.create.mockResolvedValueOnce({});
    const req = { body: { token: 'TOKN01', firebaseId: 'fb4' } };
    const res = makeRes();
    await CourseController.joinCourse(req, res);
    expect(Enrollment.create).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 4, course_id: 1, status: 'active' })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('CourseController.getAllCourses', () => {
  test('returns all courses when no filter is provided', async () => {
    const courses = [{ course_id: 1 }, { course_id: 2 }];
    Course.findAll.mockResolvedValueOnce(courses);
    const req = { query: {} };
    const res = makeRes();
    await CourseController.getAllCourses(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(courses);
  });

  test('returns empty array when firebaseId does not match any user', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const req = { query: { firebaseId: 'fb_unknown' } };
    const res = makeRes();
    await CourseController.getAllCourses(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('returns combined taught and enrolled courses for a known user', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    Course.findAll
      .mockResolvedValueOnce([{ course_id: 1 }]) 
      .mockResolvedValueOnce([{ course_id: 2 }]);  
    const req = { query: { firebaseId: 'fb1' } };
    const res = makeRes();
    await CourseController.getAllCourses(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0]).toHaveLength(2);
  });

  test('deduplicates when the same course appears in both lists', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    Course.findAll
      .mockResolvedValueOnce([{ course_id: 1 }])
      .mockResolvedValueOnce([{ course_id: 1 }]); 
    const req = { query: { firebaseId: 'fb1' } };
    const res = makeRes();
    await CourseController.getAllCourses(req, res);
    expect(res.json.mock.calls[0][0]).toHaveLength(1);
  });
});

describe('CourseController.getCourseById', () => {
  test('returns 200 with course when found', async () => {
    const course = { course_id: 1, title: 'CS101' };
    Course.findByPk.mockResolvedValueOnce(course);
    const req = { params: { id: '1' } };
    const res = makeRes();
    await CourseController.getCourseById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(course);
  });

  test('returns 404 when course is not found', async () => {
    Course.findByPk.mockResolvedValueOnce(null);
    const req = { params: { id: '999' } };
    const res = makeRes();
    await CourseController.getCourseById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Course not found' });
  });
});

describe('CourseController.updateCourse', () => {
  test('returns 200 with updated course', async () => {
    const updated = { course_id: 1, title: 'Updated' };
    Course.update.mockResolvedValueOnce([1]);
    Course.findByPk.mockResolvedValueOnce(updated);
    const req = { params: { id: '1' }, body: { title: 'Updated' } };
    const res = makeRes();
    await CourseController.updateCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  test('returns 404 when course is not found', async () => {
    Course.update.mockResolvedValueOnce([0]);
    const req = { params: { id: '999' }, body: {} };
    const res = makeRes();
    await CourseController.updateCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('CourseController.deleteCourse', () => {
  test('returns 204 when course is deleted', async () => {
    Course.destroy.mockResolvedValueOnce(1);
    const req = { params: { id: '1' } };
    const res = makeRes();
    await CourseController.deleteCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  test('returns 404 when course is not found', async () => {
    Course.destroy.mockResolvedValueOnce(0);
    const req = { params: { id: '999' } };
    const res = makeRes();
    await CourseController.deleteCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('CourseController.regenerateToken', () => {
  test('returns 200 with new 6-character uppercase alphanumeric token', async () => {
    Course.findOne.mockResolvedValueOnce(null); 
    Course.update.mockResolvedValueOnce([1]);
    const req = { params: { id: '1' } };
    const res = makeRes();
    await CourseController.regenerateToken(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const { token } = res.json.mock.calls[0][0];
    expect(token).toMatch(/^[A-Z0-9]{6}$/);
  });

  test('returns 404 when course is not found', async () => {
    Course.findOne.mockResolvedValueOnce(null);
    Course.update.mockResolvedValueOnce([0]);
    const req = { params: { id: '999' } };
    const res = makeRes();
    await CourseController.regenerateToken(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('CourseController.getEnrolledStudents', () => {
  test('returns 400 when firebaseId is missing', async () => {
    const req = { params: { id: '1' }, query: {} };
    const res = makeRes();
    await CourseController.getEnrolledStudents(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 403 when requester is not the instructor', async () => {
    User.findOne.mockResolvedValueOnce({ id: 2 });
    Course.findByPk.mockResolvedValueOnce({ course_id: 1, instructor_id: 99 });
    const req = { params: { id: '1' }, query: { firebaseId: 'fb_student' } };
    const res = makeRes();
    await CourseController.getEnrolledStudents(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 200 with formatted student list for the instructor', async () => {
    User.findOne.mockResolvedValueOnce({ id: 10 });
    Course.findByPk.mockResolvedValueOnce({ course_id: 1, instructor_id: 10 });
    Enrollment.findAll.mockResolvedValueOnce([
      {
        enrollment_id: 1, user_id: 3, enrolled_name: 'Alice',
        enrollment_date: '2025-01-01', status: 'active', points: 0, grade: null,
        user: { first_name: 'A', last_name: 'B', email: 'a@stu.kau.edu.sa', photo_url: null },
      },
    ]);
    const req = { params: { id: '1' }, query: { firebaseId: 'fb_instructor' } };
    const res = makeRes();
    await CourseController.getEnrolledStudents(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const students = res.json.mock.calls[0][0];
    expect(students).toHaveLength(1);
    expect(students[0]).toMatchObject({ enrolled_name: 'Alice', status: 'active' });
  });
});

describe('CourseController.removeStudent', () => {
  test('returns 400 when firebaseId is missing', async () => {
    const req = { params: { id: '1', userId: '3' }, body: {} };
    const res = makeRes();
    await CourseController.removeStudent(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 403 when requester is not the instructor', async () => {
    User.findOne.mockResolvedValueOnce({ id: 2 });
    Course.findByPk.mockResolvedValueOnce({ course_id: 1, instructor_id: 99 });
    const req = { params: { id: '1', userId: '3' }, body: { firebaseId: 'fb_other' } };
    const res = makeRes();
    await CourseController.removeStudent(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 404 when enrollment is not found', async () => {
    User.findOne.mockResolvedValueOnce({ id: 10 });
    Course.findByPk.mockResolvedValueOnce({ course_id: 1, instructor_id: 10 });
    Enrollment.destroy.mockResolvedValueOnce(0);
    const req = { params: { id: '1', userId: '99' }, body: { firebaseId: 'fb_instructor' } };
    const res = makeRes();
    await CourseController.removeStudent(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 when student is successfully removed', async () => {
    User.findOne.mockResolvedValueOnce({ id: 10 });
    Course.findByPk.mockResolvedValueOnce({ course_id: 1, instructor_id: 10 });
    Enrollment.destroy.mockResolvedValueOnce(1);
    const req = { params: { id: '1', userId: '3' }, body: { firebaseId: 'fb_instructor' } };
    const res = makeRes();
    await CourseController.removeStudent(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Student removed successfully' });
  });

  test('returns 404 when requesting user is not found', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const req = { params: { id: '1', userId: '3' }, body: { firebaseId: 'fb_unknown' } };
    const res = makeRes();
    await CourseController.removeStudent(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  test('returns 404 when course is not found', async () => {
    User.findOne.mockResolvedValueOnce({ id: 10 });
    Course.findByPk.mockResolvedValueOnce(null);
    const req = { params: { id: '99', userId: '3' }, body: { firebaseId: 'fb_instructor' } };
    const res = makeRes();
    await CourseController.removeStudent(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 500 on unexpected error', async () => {
    User.findOne.mockRejectedValueOnce(new Error('db down'));
    const req = { params: { id: '1', userId: '3' }, body: { firebaseId: 'fb' } };
    const res = makeRes();
    await CourseController.removeStudent(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('CourseController error-path coverage', () => {
  test('getAllCourses returns 500 on database error', async () => {
    Course.findAll.mockRejectedValueOnce(new Error('db down'));
    const res = makeRes();
    await CourseController.getAllCourses({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getCourseById returns 500 on database error', async () => {
    Course.findByPk.mockRejectedValueOnce(new Error('db down'));
    const res = makeRes();
    await CourseController.getCourseById({ params: { id: '1' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('updateCourse returns 400 when update throws', async () => {
    Course.update.mockRejectedValueOnce(new Error('bad'));
    const res = makeRes();
    await CourseController.updateCourse({ params: { id: '1' }, body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('deleteCourse returns 500 when destroy throws', async () => {
    Course.destroy.mockRejectedValueOnce(new Error('db down'));
    const res = makeRes();
    await CourseController.deleteCourse({ params: { id: '1' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('joinCourse returns 500 on unexpected error', async () => {
    User.findOne.mockRejectedValueOnce(new Error('db down'));
    const res = makeRes();
    await CourseController.joinCourse(
      { body: { firebaseId: 'fb1', token: 'TOKEN' } },
      res
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getEnrolledStudents returns 404 when user is not found', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const res = makeRes();
    await CourseController.getEnrolledStudents(
      { params: { id: '1' }, query: { firebaseId: 'fb_unknown' } },
      res
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  test('getEnrolledStudents returns 404 when course is not found', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    Course.findByPk.mockResolvedValueOnce(null);
    const res = makeRes();
    await CourseController.getEnrolledStudents(
      { params: { id: '99' }, query: { firebaseId: 'fb1' } },
      res
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('getEnrolledStudents returns 500 on unexpected error', async () => {
    User.findOne.mockRejectedValueOnce(new Error('db down'));
    const res = makeRes();
    await CourseController.getEnrolledStudents(
      { params: { id: '1' }, query: { firebaseId: 'fb1' } },
      res
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('regenerateToken returns 500 on unexpected error', async () => {
    Course.findOne.mockRejectedValueOnce(new Error('db down'));
    const res = makeRes();
    await CourseController.regenerateToken({ params: { id: '1' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('regenerateToken retries until a unique token is found', async () => {
    Course.findOne
      .mockResolvedValueOnce({ course_id: 99 })  // collision
      .mockResolvedValueOnce(null);              // free slot
    Course.update.mockResolvedValueOnce([1]);
    const res = makeRes();
    await CourseController.regenerateToken({ params: { id: '1' } }, res);
    expect(Course.findOne).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
