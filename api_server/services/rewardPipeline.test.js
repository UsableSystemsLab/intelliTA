// Tests for rewardPipeline. Every collaborator is mocked — no DB, no real
// transactions. Mock stubs live INSIDE the jest.mock factories so they
// initialize before any import triggers them; tests pull references back
// out via jest.requireMock.

jest.mock("../configs/postgresDB.js", () => {
    const txn = { LOCK: { UPDATE: "FOR UPDATE" } };
    const sequelize = {
        transaction: jest.fn((cb) => cb(txn)),
        query: jest.fn().mockResolvedValue([]),
        Sequelize: { Op: { ne: Symbol("Op.ne") } },
        __txn: txn,
    };
    return { __esModule: true, sequelize };
});

jest.mock("../models/index.js", () => ({
    __esModule: true,
    Submission: { findByPk: jest.fn() },
    SubmissionTestResult: { findAll: jest.fn() },
    ActivityTestCase: { count: jest.fn() },
    Activity: { findByPk: jest.fn() },
    UserPoints: { findOrCreate: jest.fn() },
    Badge: { findOne: jest.fn(), findAll: jest.fn() },
    UserBadge: { findOrCreate: jest.fn(), findAll: jest.fn() },
    PointsLedger: {
        count: jest.fn(),
        findAll: jest.fn(),
        findOrCreate: jest.fn(),
        create: jest.fn(),
    },
    Notification: { create: jest.fn() },
}));

jest.mock("./pointsService.js", () => ({
    __esModule: true,
    calculatePoints: jest.fn(),
}));

jest.mock("./badgeService.js", () => ({
    __esModule: true,
    checkAllBadges: jest.fn(),
}));

import { process, awardBugHunter } from "./rewardPipeline.js";

const { sequelize } = jest.requireMock("../configs/postgresDB.js");
const models = jest.requireMock("../models/index.js");
const { calculatePoints } = jest.requireMock("./pointsService.js");
const { checkAllBadges } = jest.requireMock("./badgeService.js");

const {
    Submission,
    SubmissionTestResult,
    ActivityTestCase,
    Activity,
    UserPoints,
    Badge,
    UserBadge,
    PointsLedger,
    Notification,
} = models;

const ALL_MODEL_MOCKS = [
    Submission,
    SubmissionTestResult,
    ActivityTestCase,
    Activity,
    UserPoints,
    Badge,
    UserBadge,
    PointsLedger,
    Notification,
];

beforeEach(() => {
    sequelize.transaction.mockClear();
    sequelize.query.mockClear();
    sequelize.transaction.mockImplementation((cb) => cb(sequelize.__txn));
    for (const m of ALL_MODEL_MOCKS) {
        for (const k of Object.keys(m)) m[k].mockReset();
    }
    calculatePoints.mockReset();
    checkAllBadges.mockReset();
});

const setupSubmission = () => {
    Submission.findByPk.mockResolvedValue({
        submission_id: 100,
        user_id: 7,
        activity_id: 42,
        status: "PASSED",
        attempt_number: 1,
        active_seconds: 300,
        hints_used: 0,
        created_at: new Date(),
    });
    PointsLedger.count.mockResolvedValue(0);
    Activity.findByPk.mockResolvedValue({ activity_id: 42, end_date: null });
    SubmissionTestResult.findAll.mockResolvedValue([
        { test_case_id: 1, passed: true, points_awarded: 30 },
        { test_case_id: 2, passed: true, points_awarded: 40 },
    ]);

    const userPointsRow = {
        user_id: 7,
        total_points: 0,
        last_activity_at: null,
        save: jest.fn().mockResolvedValue(undefined),
    };
    UserPoints.findOrCreate.mockResolvedValue([userPointsRow, true]);
    return userPointsRow;
};

describe("rewardPipeline.process", () => {
    test("happy path: persists ledger lines, updates points, runs badges, emits notifications", async () => {
        const userPointsRow = setupSubmission();
        calculatePoints.mockReturnValue({
            lines: [
                { event_type: "BASE", points: 70 },
                { event_type: "NO_HINT_BONUS", points: 25 },
            ],
            total: 95,
        });
        PointsLedger.findOrCreate.mockImplementation(({ defaults }) =>
            Promise.resolve([{ ...defaults }, true])
        );
        checkAllBadges.mockResolvedValue([
            { code: "SPEED_RUNNER", activity_id: 42 },
        ]);
        Badge.findAll.mockResolvedValue([
            { badge_id: 4, code: "SPEED_RUNNER", name: "Speed Runner", icon_url: null, tier: "SILVER" },
        ]);
        UserBadge.findOrCreate.mockResolvedValue([
            { user_badge_id: 1, activity_id: 42 },
            true,
        ]);
        Notification.create.mockImplementation((attrs) =>
            Promise.resolve({ notification_id: 1, ...attrs })
        );

        const out = await process({ submissionId: 100, localHour: 14 });

        expect(out.points_earned).toBe(95);
        expect(out.lines).toEqual([
            { event_type: "BASE", points: 70 },
            { event_type: "NO_HINT_BONUS", points: 25 },
        ]);
        expect(out.badges_awarded).toEqual([
            {
                code: "SPEED_RUNNER",
                name: "Speed Runner",
                icon_url: null,
                tier: "SILVER",
                activity_id: 42,
            },
        ]);
        expect(out.notifications).toHaveLength(2);

        expect(userPointsRow.total_points).toBe(95);
        expect(userPointsRow.save).toHaveBeenCalled();
        expect(PointsLedger.findOrCreate).toHaveBeenCalledTimes(2);
        expect(checkAllBadges).toHaveBeenCalled();
        expect(sequelize.query).toHaveBeenCalled();
    });

    test("idempotent: returns cached aggregate when ledger rows already exist", async () => {
        Submission.findByPk.mockResolvedValue({
            submission_id: 100,
            user_id: 7,
            activity_id: 42,
            status: "PASSED",
        });
        PointsLedger.count.mockResolvedValue(2);
        PointsLedger.findAll.mockResolvedValue([
            { event_type: "BASE", points: 70 },
            { event_type: "NO_HINT_BONUS", points: 25 },
        ]);
        UserBadge.findAll.mockResolvedValue([
            {
                activity_id: 42,
                badge: { code: "SPEED_RUNNER", name: "Speed Runner", icon_url: null, tier: "SILVER" },
            },
        ]);

        const out = await process({ submissionId: 100 });

        expect(out.cached).toBe(true);
        expect(out.points_earned).toBe(95);
        expect(out.badges_awarded).toHaveLength(1);
        expect(calculatePoints).not.toHaveBeenCalled();
        expect(PointsLedger.findOrCreate).not.toHaveBeenCalled();
        expect(Notification.create).not.toHaveBeenCalled();
    });

    test("zero total: skips badge checks and POINTS_EARNED notification", async () => {
        const userPointsRow = setupSubmission();
        calculatePoints.mockReturnValue({ lines: [], total: 0 });

        const out = await process({ submissionId: 100 });

        expect(out.points_earned).toBe(0);
        expect(out.badges_awarded).toEqual([]);
        expect(out.notifications).toEqual([]);
        expect(checkAllBadges).not.toHaveBeenCalled();
        expect(userPointsRow.total_points).toBe(0);
    });

    test("FAILED submission earns partial points but no badges", async () => {
        Submission.findByPk.mockResolvedValue({
            submission_id: 100,
            user_id: 7,
            activity_id: 42,
            status: "FAILED",
            attempt_number: 1,
            hints_used: 0,
        });
        PointsLedger.count.mockResolvedValue(0);
        Activity.findByPk.mockResolvedValue({ activity_id: 42, end_date: null });
        SubmissionTestResult.findAll.mockResolvedValue([
            { test_case_id: 1, passed: true, points_awarded: 20 },
            { test_case_id: 2, passed: false, points_awarded: 0 },
        ]);
        const userPointsRow = {
            user_id: 7, total_points: 0, last_activity_at: null,
            save: jest.fn().mockResolvedValue(undefined),
        };
        UserPoints.findOrCreate.mockResolvedValue([userPointsRow, true]);
        calculatePoints.mockReturnValue({
            lines: [{ event_type: "BASE", points: 20 }],
            total: 20,
        });
        PointsLedger.findOrCreate.mockImplementation(({ defaults }) =>
            Promise.resolve([{ ...defaults }, true])
        );
        Notification.create.mockImplementation((attrs) =>
            Promise.resolve({ notification_id: 1, ...attrs })
        );

        const out = await process({ submissionId: 100 });

        expect(out.points_earned).toBe(20);
        expect(out.badges_awarded).toEqual([]);
        expect(checkAllBadges).not.toHaveBeenCalled();
        expect(userPointsRow.total_points).toBe(20);
    });

    test("throws 404 when submission missing", async () => {
        Submission.findByPk.mockResolvedValue(null);
        await expect(process({ submissionId: 999 })).rejects.toMatchObject({
            status: 404,
        });
    });

    test("does not re-notify when UserBadge.findOrCreate returns existing row", async () => {
        setupSubmission();
        calculatePoints.mockReturnValue({
            lines: [{ event_type: "BASE", points: 10 }],
            total: 10,
        });
        PointsLedger.findOrCreate.mockImplementation(({ defaults }) =>
            Promise.resolve([{ ...defaults }, true])
        );
        checkAllBadges.mockResolvedValue([{ code: "NIGHT_OWL", activity_id: 42 }]);
        Badge.findAll.mockResolvedValue([
            { badge_id: 3, code: "NIGHT_OWL", name: "Night Owl", icon_url: null, tier: "BRONZE" },
        ]);
        UserBadge.findOrCreate.mockResolvedValue([{ user_badge_id: 5 }, false]);
        Notification.create.mockResolvedValue({
            notification_id: 1,
            type: "POINTS_EARNED",
            title: "",
            body: "",
        });

        const out = await process({ submissionId: 100 });

        expect(out.badges_awarded).toEqual([]);
        expect(Notification.create).toHaveBeenCalledTimes(1);
    });
});

describe("rewardPipeline.awardBugHunter", () => {
    test("awards badge, writes audit ledger row, emits INSTRUCTOR_AWARD notification", async () => {
        Badge.findOne.mockResolvedValue({
            badge_id: 2,
            code: "BUG_HUNTER",
            name: "Bug Hunter",
            icon_url: null,
            tier: "SILVER",
        });
        UserBadge.findOrCreate.mockResolvedValue([
            { user_badge_id: 11, activity_id: null },
            true,
        ]);
        PointsLedger.create.mockResolvedValue({});
        Notification.create.mockResolvedValue({
            notification_id: 99,
            type: "INSTRUCTOR_AWARD",
            title: "Bug Hunter awarded",
            body: "...",
        });

        const out = await awardBugHunter({
            instructorId: 1,
            userId: 7,
            activityId: null,
            reason: "Found a typo in tests",
        });

        expect(out.badge.code).toBe("BUG_HUNTER");
        expect(out.badge.user_badge_id).toBe(11);
        expect(out.notification.id).toBe(99);
        expect(PointsLedger.create).toHaveBeenCalledWith(
            expect.objectContaining({
                user_id: 7,
                event_type: "BUG_HUNTER_AWARD",
                points: 0,
            }),
            expect.any(Object)
        );
    });

    test("throws 409 when user already has the badge", async () => {
        Badge.findOne.mockResolvedValue({ badge_id: 2, code: "BUG_HUNTER", name: "Bug Hunter" });
        UserBadge.findOrCreate.mockResolvedValue([{ user_badge_id: 11 }, false]);

        await expect(
            awardBugHunter({ instructorId: 1, userId: 7 })
        ).rejects.toMatchObject({ status: 409 });
        expect(PointsLedger.create).not.toHaveBeenCalled();
        expect(Notification.create).not.toHaveBeenCalled();
    });

    test("throws 500 when BUG_HUNTER badge is not seeded", async () => {
        Badge.findOne.mockResolvedValue(null);
        await expect(
            awardBugHunter({ instructorId: 1, userId: 7 })
        ).rejects.toMatchObject({ status: 500 });
    });
});
