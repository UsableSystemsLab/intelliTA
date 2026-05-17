jest.mock("../models/UserPoints.js", () => ({
    __esModule: true,
    default: { findByPk: jest.fn() },
}));
jest.mock("../models/Submission.js", () => ({
    __esModule: true,
    default: { count: jest.fn() },
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
    sequelize: {},
}));
jest.mock("../utils/resolveUserParam.js", () => ({
    __esModule: true,
    resolveUserParam: jest.fn(async (v) => {
        if (v == null || v === "") return null;
        const n = parseInt(v, 10);
        return Number.isNaN(n) ? null : n;
    }),
    default: undefined,
}));

import { mockReq, mockRes } from "../__tests__/helpers/mockReqRes.js";
import UserPoints from "../models/UserPoints.js";
import Submission from "../models/Submission.js";
import Badge from "../models/Badge.js";
import UserBadge from "../models/UserBadge.js";
import PointsLedger from "../models/PointsLedger.js";
import rewardPipeline from "../services/rewardPipeline.js";
import RewardController from "./rewardController.js";

describe("RewardController.getRewards", () => {
    test("aggregates points, completed activities, badge counts", async () => {
        UserPoints.findByPk.mockResolvedValue({ total_points: 1240 });
        Submission.count.mockResolvedValue(12);
        UserBadge.count.mockResolvedValue(5);
        Badge.count.mockResolvedValue(10);
        const req = mockReq({ params: { userId: "1" } });
        const res = mockRes();
        await RewardController.getRewards(req, res);
        expect(res.json).toHaveBeenCalledWith({
            total_points: 1240,
            completed_activities: 12,
            badges_earned_count: 5,
            badges_total_count: 10,
        });
    });

    test("defaults total_points to 0 when no UserPoints row exists", async () => {
        UserPoints.findByPk.mockResolvedValue(null);
        Submission.count.mockResolvedValue(0);
        UserBadge.count.mockResolvedValue(0);
        Badge.count.mockResolvedValue(10);
        const req = mockReq({ params: { userId: "1" } });
        const res = mockRes();
        await RewardController.getRewards(req, res);
        expect(res.json.mock.calls[0][0].total_points).toBe(0);
    });
});

describe("RewardController.getRewardsHistory", () => {
    test("returns paginated history with a next_cursor when more rows exist", async () => {
        const rows = Array.from({ length: 21 }, (_, i) => ({
            ledger_id: 100 - i,
            event_type: "BASE",
            points: 10,
            submission_id: i,
            activity_id: 1,
            metadata: null,
            created_at: new Date(2026, 0, 1, 0, 0, 0, 21 - i),
        }));
        PointsLedger.findAll.mockResolvedValue(rows);
        const req = mockReq({ params: { userId: "1" }, query: { limit: "20" } });
        const res = mockRes();
        await RewardController.getRewardsHistory(req, res);
        const body = res.json.mock.calls[0][0];
        expect(body.items).toHaveLength(20);
        expect(body.next_cursor).not.toBeNull();
    });

    test("no next_cursor on the final page", async () => {
        PointsLedger.findAll.mockResolvedValue([{
            ledger_id: 1, event_type: "BASE", points: 10,
            submission_id: 1, activity_id: 1, metadata: null,
            created_at: new Date(),
        }]);
        const req = mockReq({ params: { userId: "1" } });
        const res = mockRes();
        await RewardController.getRewardsHistory(req, res);
        expect(res.json.mock.calls[0][0].next_cursor).toBeNull();
    });
});

describe("RewardController.getBadges", () => {
    test("splits earned vs locked", async () => {
        UserBadge.findAll.mockResolvedValue([
            {
                badge: { badge_id: 1, code: "EARLYBIRD", name: "Earlybird", icon_url: null, tier: "BRONZE" },
                activity: { activity_id: 7, title: "Lab 1" },
                awarded_at: new Date(),
                activity_id: 7,
            },
        ]);
        Badge.findAll.mockResolvedValue([
            { badge_id: 1, code: "EARLYBIRD", name: "Earlybird", description: "", icon_url: null, tier: "BRONZE" },
            { badge_id: 2, code: "NIGHT_OWL", name: "Night Owl", description: "", icon_url: null, tier: "BRONZE" },
        ]);
        const req = mockReq({ params: { userId: "1" } });
        const res = mockRes();
        await RewardController.getBadges(req, res);
        const body = res.json.mock.calls[0][0];
        expect(body.earned).toHaveLength(1);
        expect(body.earned[0].activity_title).toBe("Lab 1");
        expect(body.locked).toHaveLength(1);
        expect(body.locked[0].code).toBe("NIGHT_OWL");
    });
});

describe("RewardController.awardBugHunter", () => {
    test("delegates to rewardPipeline.awardBugHunter", async () => {
        rewardPipeline.awardBugHunter.mockResolvedValue({ badge: { code: "BUG_HUNTER" } });
        const req = mockReq({
            body: { user_id: 5, activity_id: 42, reason: "found a bug" },
            callerUserId: 9,
        });
        const res = mockRes();
        await RewardController.awardBugHunter(req, res);
        expect(rewardPipeline.awardBugHunter).toHaveBeenCalledWith({
            instructorId: 9,
            userId: 5,
            activityId: 42,
            reason: "found a bug",
        });
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test("400 when user_id is missing", async () => {
        const req = mockReq({ body: {}, callerUserId: 9 });
        const res = mockRes();
        await RewardController.awardBugHunter(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test("surfaces pipeline error status (e.g., 409 already awarded)", async () => {
        const err = new Error("User already has this Bug Hunter badge");
        err.status = 409;
        rewardPipeline.awardBugHunter.mockRejectedValue(err);
        const req = mockReq({ body: { user_id: 5 }, callerUserId: 9 });
        const res = mockRes();
        await RewardController.awardBugHunter(req, res);
        expect(res.status).toHaveBeenCalledWith(409);
    });
});
