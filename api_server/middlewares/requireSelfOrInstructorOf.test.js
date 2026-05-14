jest.mock("../models/User.js", () => ({
    __esModule: true,
    default: { findOne: jest.fn() },
}));
jest.mock("../models/Course.js", () => ({
    __esModule: true,
    default: { count: jest.fn() },
}));
jest.mock("../models/Enrollment.js", () => ({
    __esModule: true,
    default: { findAll: jest.fn() },
}));

import { mockReq, mockRes } from "../__tests__/helpers/mockReqRes.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import { requireSelfOrInstructorOf } from "./requireSelfOrInstructorOf.js";

const getTarget = (req) => parseInt(req.params.userId, 10);

describe("requireSelfOrInstructorOf", () => {
    test("400 when target id is not a number", async () => {
        const req = mockReq({ params: { userId: "abc" }, firebaseUser: { uid: "u" } });
        const res = mockRes();
        const next = jest.fn();
        await requireSelfOrInstructorOf(getTarget)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    test("401 when caller is not registered", async () => {
        User.findOne.mockResolvedValue(null);
        const req = mockReq({ params: { userId: "5" }, firebaseUser: { uid: "u" } });
        const res = mockRes();
        const next = jest.fn();
        await requireSelfOrInstructorOf(getTarget)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    test("allows self", async () => {
        User.findOne.mockResolvedValue({ id: 5 });
        const req = mockReq({ params: { userId: "5" }, firebaseUser: { uid: "u" } });
        const res = mockRes();
        const next = jest.fn();
        await requireSelfOrInstructorOf(getTarget)(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test("allows instructor of a course where target is enrolled", async () => {
        User.findOne.mockResolvedValue({ id: 9 });
        Enrollment.findAll.mockResolvedValue([{ course_id: 1 }, { course_id: 2 }]);
        Course.count.mockResolvedValue(1);
        const req = mockReq({ params: { userId: "5" }, firebaseUser: { uid: "u" } });
        const res = mockRes();
        const next = jest.fn();
        await requireSelfOrInstructorOf(getTarget)(req, res, next);
        expect(Course.count).toHaveBeenCalledWith({
            where: { instructor_id: 9, course_id: [1, 2] },
        });
        expect(next).toHaveBeenCalled();
    });

    test("403 when caller is neither self nor an instructor of target's courses", async () => {
        User.findOne.mockResolvedValue({ id: 9 });
        Enrollment.findAll.mockResolvedValue([{ course_id: 1 }]);
        Course.count.mockResolvedValue(0);
        const req = mockReq({ params: { userId: "5" }, firebaseUser: { uid: "u" } });
        const res = mockRes();
        const next = jest.fn();
        await requireSelfOrInstructorOf(getTarget)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test("403 when target has no enrollments at all", async () => {
        User.findOne.mockResolvedValue({ id: 9 });
        Enrollment.findAll.mockResolvedValue([]);
        const req = mockReq({ params: { userId: "5" }, firebaseUser: { uid: "u" } });
        const res = mockRes();
        const next = jest.fn();
        await requireSelfOrInstructorOf(getTarget)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
});
