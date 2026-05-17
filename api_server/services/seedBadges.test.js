jest.mock("../models/index.js", () => ({
    __esModule: true,
    Badge: {
        findAll: jest.fn(),
        bulkCreate: jest.fn(),
    },
}));
jest.mock("../configs/logger.js", () => ({
    __esModule: true,
    default: { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { Badge } from "../models/index.js";
import seedBadges, { BADGE_CATALOG } from "./seedBadges.js";

describe("seedBadges", () => {
    beforeEach(() => {
        Badge.findAll.mockReset();
        Badge.bulkCreate.mockReset();
    });

    it("inserts the full catalog on an empty table", async () => {
        Badge.findAll.mockResolvedValue([]);
        Badge.bulkCreate.mockResolvedValue([]);

        const result = await seedBadges();

        expect(result.inserted).toBe(BADGE_CATALOG.length);
        expect(Badge.bulkCreate).toHaveBeenCalledTimes(1);
        const inserted = Badge.bulkCreate.mock.calls[0][0];
        expect(inserted.map((b) => b.code).sort()).toEqual(
            BADGE_CATALOG.map((b) => b.code).sort(),
        );
    });

    it("only inserts the badges that are missing", async () => {
        Badge.findAll.mockResolvedValue([
            { code: "EARLYBIRD" },
            { code: "BUG_HUNTER" },
            { code: "MILESTONE_100" },
        ]);
        Badge.bulkCreate.mockResolvedValue([]);

        const result = await seedBadges();

        expect(result.inserted).toBe(BADGE_CATALOG.length - 3);
        const insertedCodes = Badge.bulkCreate.mock.calls[0][0].map((b) => b.code);
        expect(insertedCodes).not.toContain("EARLYBIRD");
        expect(insertedCodes).not.toContain("BUG_HUNTER");
        expect(insertedCodes).not.toContain("MILESTONE_100");
    });

    it("is a no-op when every badge already exists", async () => {
        Badge.findAll.mockResolvedValue(BADGE_CATALOG.map((b) => ({ code: b.code })));

        const result = await seedBadges();

        expect(result.inserted).toBe(0);
        expect(Badge.bulkCreate).not.toHaveBeenCalled();
    });
});
