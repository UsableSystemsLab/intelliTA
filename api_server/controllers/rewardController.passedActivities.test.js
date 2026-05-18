jest.mock("../models/UserPoints.js", () => ({
    __esModule: true,
    default: { findByPk: jest.fn() },
}));
jest.mock("../models/Submission.js", () => ({
    __esModule: true,
    default: { count: jest.fn(), findAll: jest.fn() },
}));
jest.mock("../models/Badge.js", () => ({
    __esModule: true,
    default: { count: jest.fn(), findAll: jest.fn() },
}));
jest.mock("../models/UserBadge.js", () => ({
    __esModule: true,
    default: { count: jest.fn(), findAll: jest.fn() },
}));
jest.mock("../models/PointsLedger.js", () => ({
    __esModule: true,
    default: { findAll: jest.fn() },
}));
jest.mock("../models/Activity.js", () => ({ __esModule: true, default: {} }));
jest.mock("../services/rewardPipeline.js", () => ({
    __esModule: true,
    default: { awardBugHunter: jest.fn() },
}));
jest.mock("../configs/postgresDB.js", () => ({
    __esModule: true,
    sequelize: {
        fn: jest.fn((fnName, col) => ({ fn: fnName, col })),
        col: jest.fn((name) => ({ col: name })),
    },
}));

import { mockReq, mockRes } from "../__tests__/helpers/mockReqRes.js";
import Submission from "../models/Submission.js";
import { sequelize } from "../configs/postgresDB.js";
import RewardController from "./rewardController.js";

describe("RewardController.getPassedActivities", () => {
    test("returns distinct PASSED activity_ids for the user", async () => {
        Submission.findAll.mockResolvedValue([
            { activity_id: 12 },
            { activity_id: 7 },
            { activity_id: 33 },
        ]);
        const req = mockReq({ params: { userId: "42" } });
        const res = mockRes();

        await RewardController.getPassedActivities(req, res);

        expect(Submission.findAll).toHaveBeenCalledTimes(1);
        const args = Submission.findAll.mock.calls[0][0];
        expect(args.where).toEqual({ user_id: 42, status: "PASSED" });
        expect(args.raw).toBe(true);
        expect(sequelize.fn).toHaveBeenCalledWith("DISTINCT", expect.anything());
        expect(sequelize.col).toHaveBeenCalledWith("activity_id");

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ activity_ids: [12, 7, 33] });
    });

    test("returns an empty array when the user has no passed submissions", async () => {
        Submission.findAll.mockResolvedValue([]);
        const req = mockReq({ params: { userId: "9" } });
        const res = mockRes();

        await RewardController.getPassedActivities(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ activity_ids: [] });
    });

    test("responds with 500 when the database query throws", async () => {
        Submission.findAll.mockRejectedValue(new Error("db down"));
        const req = mockReq({ params: { userId: "1" } });
        const res = mockRes();
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});

        await RewardController.getPassedActivities(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Failed to load passed activities" });
        spy.mockRestore();
    });
});
