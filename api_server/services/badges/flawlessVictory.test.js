import flawlessVictory from "./flawlessVictory.js";

const ctx = (overrides = {}) => ({
    submission: { status: "PASSED", attempt_number: 1, activity_id: 9 },
    activity: { activity_id: 9 },
    testResults: [
        { test_case_id: 1, passed: true },
        { test_case_id: 2, passed: true },
        { test_case_id: 3, passed: true },
    ],
    models: { ActivityTestCase: { count: jest.fn().mockResolvedValue(3) } },
    txn: {},
    ...overrides,
});

describe("FLAWLESS_VICTORY checker", () => {
    test("awards when attempt 1 and every test case passed", async () => {
        await expect(flawlessVictory.check(ctx())).resolves.toEqual({
            code: "FLAWLESS_VICTORY",
            activity_id: 9,
        });
    });

    test("does not award on attempt 2", async () => {
        await expect(
            flawlessVictory.check(ctx({ submission: { status: "PASSED", attempt_number: 2, activity_id: 9 } }))
        ).resolves.toBeNull();
    });

    test("does not award when some test case failed", async () => {
        const c = ctx();
        c.testResults[1].passed = false;
        await expect(flawlessVictory.check(c)).resolves.toBeNull();
    });

    test("does not award when activity has zero registered test cases", async () => {
        const c = ctx({
            models: { ActivityTestCase: { count: jest.fn().mockResolvedValue(0) } },
            testResults: [],
        });
        await expect(flawlessVictory.check(c)).resolves.toBeNull();
    });

    test("does not award when failed", async () => {
        const c = ctx();
        c.submission.status = "FAILED";
        await expect(flawlessVictory.check(c)).resolves.toBeNull();
    });
});
