jest.mock("../models/User.js", () => ({
    __esModule: true,
    default: { findOne: jest.fn() },
}));
jest.mock("../models/Course.js", () => ({
    __esModule: true,
    default: { count: jest.fn() },
}));

import { mockReq, mockRes } from "../__tests__/helpers/mockReqRes.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import { requireInstructor } from "./requireInstructor.js";

describe("requireInstructor", () => {
    test("allows instructor and sets req.callerUserId", async () => {
        User.findOne.mockResolvedValue({ id: 3 });
        Course.count.mockResolvedValue(2);
        const req = mockReq({ firebaseUser: { uid: "u" } });
        const res = mockRes();
        const next = jest.fn();
        await requireInstructor(req, res, next);
        expect(req.callerUserId).toBe(3);
        expect(next).toHaveBeenCalled();
    });

    test("403 when caller teaches no courses", async () => {
        User.findOne.mockResolvedValue({ id: 3 });
        Course.count.mockResolvedValue(0);
        const req = mockReq({ firebaseUser: { uid: "u" } });
        const res = mockRes();
        const next = jest.fn();
        await requireInstructor(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test("401 when caller is not registered", async () => {
        User.findOne.mockResolvedValue(null);
        const req = mockReq({ firebaseUser: { uid: "u" } });
        const res = mockRes();
        const next = jest.fn();
        await requireInstructor(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
    });
});
