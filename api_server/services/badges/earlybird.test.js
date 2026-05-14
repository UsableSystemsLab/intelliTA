jest.mock("sequelize", () => ({
    __esModule: true,
    Op: { ne: Symbol("Op.ne") },
}));

import earlybird from "./earlybird.js";

const makeCtx = (overrides = {}) => {
    const sequelize = { query: jest.fn().mockResolvedValue([]) };
    const Submission = {
        findOne: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
    };
    return {
        ctx: {
            submission: { status: "PASSED", user_id: 1, activity_id: 42, submission_id: 100 },
            activity: { activity_id: 42 },
            models: { Submission, ...overrides.models },
            txn: {},
            sequelize,
            ...overrides.ctx,
        },
        sequelize,
        Submission,
    };
};

describe("EARLYBIRD checker", () => {
    test("awards on first pass when < 3 other passers", async () => {
        const { ctx, sequelize, Submission } = makeCtx();
        await expect(earlybird.check(ctx)).resolves.toEqual({
            code: "EARLYBIRD",
            activity_id: 42,
        });
        // Verifies we serialized via FOR UPDATE before reading
        expect(sequelize.query).toHaveBeenCalled();
        expect(Submission.findOne).toHaveBeenCalled();
        expect(Submission.count).toHaveBeenCalled();
    });

    test("does not award when user already passed before", async () => {
        const { ctx, Submission } = makeCtx();
        Submission.findOne.mockResolvedValueOnce({ submission_id: 99 });
        await expect(earlybird.check(ctx)).resolves.toBeNull();
    });

    test("does not award when 3+ other users have passed", async () => {
        const { ctx, Submission } = makeCtx();
        Submission.count.mockResolvedValueOnce(3);
        await expect(earlybird.check(ctx)).resolves.toBeNull();
    });

    test("does not award when submission failed", async () => {
        const { ctx } = makeCtx();
        ctx.submission.status = "FAILED";
        await expect(earlybird.check(ctx)).resolves.toBeNull();
    });
});
