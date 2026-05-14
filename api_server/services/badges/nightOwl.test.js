import nightOwl from "./nightOwl.js";

const ctx = (overrides = {}) => ({
    submission: { status: "PASSED", activity_id: 42 },
    localHour: 2,
    ...overrides,
});

describe("NIGHT_OWL checker", () => {
    test("awards when passed and localHour in [0,5)", async () => {
        await expect(nightOwl.check(ctx({ localHour: 0 }))).resolves.toEqual({
            code: "NIGHT_OWL",
            activity_id: 42,
        });
        await expect(nightOwl.check(ctx({ localHour: 4 }))).resolves.toEqual({
            code: "NIGHT_OWL",
            activity_id: 42,
        });
    });

    test("does not award when localHour ≥ 5", async () => {
        await expect(nightOwl.check(ctx({ localHour: 5 }))).resolves.toBeNull();
        await expect(nightOwl.check(ctx({ localHour: 12 }))).resolves.toBeNull();
    });

    test("does not award when submission failed", async () => {
        await expect(
            nightOwl.check(ctx({ submission: { status: "FAILED", activity_id: 42 } }))
        ).resolves.toBeNull();
    });

    test("does not award when localHour is missing", async () => {
        await expect(nightOwl.check(ctx({ localHour: undefined }))).resolves.toBeNull();
        await expect(nightOwl.check(ctx({ localHour: "2" }))).resolves.toBeNull();
    });
});
