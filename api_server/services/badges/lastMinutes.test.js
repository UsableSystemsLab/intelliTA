import lastMinutes from "./lastMinutes.js";

const HOUR_MS = 60 * 60 * 1000;
const submittedAt = new Date("2026-05-13T12:00:00Z");

const ctx = (deltaMs, overrides = {}) => ({
    submission: {
        status: "PASSED",
        activity_id: 11,
        created_at: submittedAt,
    },
    activity: {
        activity_id: 11,
        end_date: new Date(submittedAt.getTime() + deltaMs),
    },
    ...overrides,
});

describe("LAST_MINUTES checker", () => {
    test("awards when 0 ≤ end_date − created_at ≤ 1h", async () => {
        await expect(lastMinutes.check(ctx(30 * 60 * 1000))).resolves.toEqual({
            code: "LAST_MINUTES",
            activity_id: 11,
        });
        await expect(lastMinutes.check(ctx(0))).resolves.toEqual({
            code: "LAST_MINUTES",
            activity_id: 11,
        });
        await expect(lastMinutes.check(ctx(HOUR_MS))).resolves.toEqual({
            code: "LAST_MINUTES",
            activity_id: 11,
        });
    });

    test("does not award after deadline (delta < 0)", async () => {
        await expect(lastMinutes.check(ctx(-1))).resolves.toBeNull();
    });

    test("does not award more than 1h before deadline", async () => {
        await expect(lastMinutes.check(ctx(HOUR_MS + 1))).resolves.toBeNull();
    });

    test("does not award when activity has no end_date", async () => {
        await expect(
            lastMinutes.check({
                submission: { status: "PASSED", activity_id: 11, created_at: submittedAt },
                activity: { activity_id: 11, end_date: null },
            })
        ).resolves.toBeNull();
    });

    test("does not award when submission failed", async () => {
        const c = ctx(30 * 60 * 1000);
        c.submission.status = "FAILED";
        await expect(lastMinutes.check(c)).resolves.toBeNull();
    });
});
