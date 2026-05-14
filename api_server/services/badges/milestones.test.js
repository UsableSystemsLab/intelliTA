import milestones from "./milestones.js";

const ctx = (prev, cur) => ({
    prevTotalPoints: prev,
    userPoints: { total_points: cur },
});

describe("MILESTONES checker", () => {
    test("crossing 100 awards MILESTONE_100", async () => {
        await expect(milestones.check(ctx(50, 150))).resolves.toEqual([
            { code: "MILESTONE_100", activity_id: null },
        ]);
    });

    test("hitting threshold exactly awards", async () => {
        await expect(milestones.check(ctx(99, 100))).resolves.toEqual([
            { code: "MILESTONE_100", activity_id: null },
        ]);
    });

    test("not crossing → null", async () => {
        await expect(milestones.check(ctx(150, 200))).resolves.toBeNull();
        await expect(milestones.check(ctx(0, 50))).resolves.toBeNull();
    });

    test("a big jump awards every crossed threshold in one shot", async () => {
        const out = await milestones.check(ctx(0, 1200));
        expect(out).toEqual([
            { code: "MILESTONE_100", activity_id: null },
            { code: "MILESTONE_500", activity_id: null },
            { code: "MILESTONE_1000", activity_id: null },
        ]);
    });

    test("does not re-award already-passed thresholds", async () => {
        await expect(milestones.check(ctx(500, 700))).resolves.toBeNull();
    });

    test("handles missing prevTotalPoints", async () => {
        const out = await milestones.check({ userPoints: { total_points: 100 } });
        expect(out).toEqual([{ code: "MILESTONE_100", activity_id: null }]);
    });
});
