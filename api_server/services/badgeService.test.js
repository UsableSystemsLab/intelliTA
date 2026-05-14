jest.mock("./badges/earlybird.js", () => ({
    __esModule: true,
    default: { code: "EARLYBIRD", check: jest.fn() },
}));
jest.mock("./badges/nightOwl.js", () => ({
    __esModule: true,
    default: { code: "NIGHT_OWL", check: jest.fn() },
}));
jest.mock("./badges/speedRunner.js", () => ({
    __esModule: true,
    default: { code: "SPEED_RUNNER", check: jest.fn() },
}));
jest.mock("./badges/lastMinutes.js", () => ({
    __esModule: true,
    default: { code: "LAST_MINUTES", check: jest.fn() },
}));
jest.mock("./badges/flawlessVictory.js", () => ({
    __esModule: true,
    default: { code: "FLAWLESS_VICTORY", check: jest.fn() },
}));
jest.mock("./badges/milestones.js", () => ({
    __esModule: true,
    default: { code: "MILESTONES", check: jest.fn() },
}));

import { checkAllBadges } from "./badgeService.js";
import earlybird from "./badges/earlybird.js";
import nightOwl from "./badges/nightOwl.js";
import speedRunner from "./badges/speedRunner.js";
import lastMinutes from "./badges/lastMinutes.js";
import flawlessVictory from "./badges/flawlessVictory.js";
import milestones from "./badges/milestones.js";

const allCheckers = [earlybird, nightOwl, speedRunner, lastMinutes, flawlessVictory, milestones];

beforeEach(() => {
    for (const c of allCheckers) c.check.mockReset();
});

describe("checkAllBadges", () => {
    test("returns empty array when every checker returns null", async () => {
        for (const c of allCheckers) c.check.mockResolvedValue(null);
        await expect(checkAllBadges({})).resolves.toEqual([]);
    });

    test("collects single-award returns", async () => {
        earlybird.check.mockResolvedValue({ code: "EARLYBIRD", activity_id: 1 });
        nightOwl.check.mockResolvedValue({ code: "NIGHT_OWL", activity_id: 1 });
        speedRunner.check.mockResolvedValue(null);
        lastMinutes.check.mockResolvedValue(null);
        flawlessVictory.check.mockResolvedValue(null);
        milestones.check.mockResolvedValue(null);

        await expect(checkAllBadges({})).resolves.toEqual([
            { code: "EARLYBIRD", activity_id: 1 },
            { code: "NIGHT_OWL", activity_id: 1 },
        ]);
    });

    test("flattens array results from milestones", async () => {
        for (const c of allCheckers) c.check.mockResolvedValue(null);
        milestones.check.mockResolvedValue([
            { code: "MILESTONE_100", activity_id: null },
            { code: "MILESTONE_500", activity_id: null },
        ]);

        await expect(checkAllBadges({})).resolves.toEqual([
            { code: "MILESTONE_100", activity_id: null },
            { code: "MILESTONE_500", activity_id: null },
        ]);
    });

    test("passes the same ctx to every checker", async () => {
        for (const c of allCheckers) c.check.mockResolvedValue(null);
        const ctx = { submission: { id: 1 } };
        await checkAllBadges(ctx);
        for (const c of allCheckers) {
            expect(c.check).toHaveBeenCalledWith(ctx);
        }
    });
});
