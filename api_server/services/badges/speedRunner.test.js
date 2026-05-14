import speedRunner from "./speedRunner.js";

const sub = (overrides = {}) => ({
    status: "PASSED",
    attempt_number: 1,
    active_seconds: 600,
    activity_id: 7,
    ...overrides,
});

describe("SPEED_RUNNER checker", () => {
    test("awards on attempt 1 with active_seconds < 900", async () => {
        await expect(speedRunner.check({ submission: sub() })).resolves.toEqual({
            code: "SPEED_RUNNER",
            activity_id: 7,
        });
    });

    test("boundary: 899s awards, 900s does not", async () => {
        await expect(
            speedRunner.check({ submission: sub({ active_seconds: 899 }) })
        ).resolves.toEqual({ code: "SPEED_RUNNER", activity_id: 7 });
        await expect(
            speedRunner.check({ submission: sub({ active_seconds: 900 }) })
        ).resolves.toBeNull();
    });

    test("does not award on attempt 2+", async () => {
        await expect(
            speedRunner.check({ submission: sub({ attempt_number: 2 }) })
        ).resolves.toBeNull();
    });

    test("does not award when failed", async () => {
        await expect(
            speedRunner.check({ submission: sub({ status: "FAILED" }) })
        ).resolves.toBeNull();
    });
});
