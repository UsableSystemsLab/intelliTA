jest.mock("../models/User.js", () => ({
    __esModule: true,
    default: { findOne: jest.fn() },
}));

import { mockReq, mockRes } from "../__tests__/helpers/mockReqRes.js";
import User from "../models/User.js";
import { requireSelf } from "./requireSelf.js";

const getTarget = (req) => parseInt(req.params.userId, 10);

describe("requireSelf", () => {
    test("allows when caller matches target", async () => {
        User.findOne.mockResolvedValue({ id: 7 });
        const req = mockReq({ params: { userId: "7" }, firebaseUser: { uid: "u" } });
        const res = mockRes();
        const next = jest.fn();
        await requireSelf(getTarget)(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test("403 when caller is a different user", async () => {
        User.findOne.mockResolvedValue({ id: 7 });
        const req = mockReq({ params: { userId: "8" }, firebaseUser: { uid: "u" } });
        const res = mockRes();
        const next = jest.fn();
        await requireSelf(getTarget)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test("401 when caller is not registered", async () => {
        User.findOne.mockResolvedValue(null);
        const req = mockReq({ params: { userId: "7" }, firebaseUser: { uid: "u" } });
        const res = mockRes();
        const next = jest.fn();
        await requireSelf(getTarget)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
    });
});
