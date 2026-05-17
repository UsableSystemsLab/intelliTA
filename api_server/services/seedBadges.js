import { Badge } from "../models/index.js";
import logger from "../configs/logger.js";

const BADGE_CATALOG = [
    { code: "EARLYBIRD", name: "Earlybird", description: "Among the first to pass this activity.", tier: "BRONZE", awarded_by: "AUTO" },
    { code: "BUG_HUNTER", name: "Bug Hunter", description: "Awarded by an instructor for reporting an issue.", tier: "SILVER", awarded_by: "INSTRUCTOR" },
    { code: "NIGHT_OWL", name: "Night Owl", description: "Passed an activity between midnight and 5 AM.", tier: "BRONZE", awarded_by: "AUTO" },
    { code: "SPEED_RUNNER", name: "Speed Runner", description: "Passed an activity on the first attempt in under 15 minutes.", tier: "SILVER", awarded_by: "AUTO" },
    { code: "LAST_MINUTES", name: "Last Minutes", description: "Passed within the final hour before the deadline.", tier: "BRONZE", awarded_by: "AUTO" },
    { code: "FLAWLESS_VICTORY", name: "Flawless Victory", description: "Passed every test on the first attempt.", tier: "GOLD", awarded_by: "AUTO" },
    { code: "MILESTONE_100", name: "Milestone: 100", description: "Reached 100 total points.", tier: "BRONZE", awarded_by: "AUTO" },
    { code: "MILESTONE_500", name: "Milestone: 500", description: "Reached 500 total points.", tier: "SILVER", awarded_by: "AUTO" },
    { code: "MILESTONE_1000", name: "Milestone: 1000", description: "Reached 1,000 total points.", tier: "GOLD", awarded_by: "AUTO" },
    { code: "MILESTONE_5000", name: "Milestone: 5000", description: "Reached 5,000 total points.", tier: "GOLD", awarded_by: "AUTO" },
];

export async function seedBadges() {
    const existing = await Badge.findAll({ attributes: ["code"] });
    const existingCodes = new Set(existing.map((b) => b.code));
    const missing = BADGE_CATALOG.filter((b) => !existingCodes.has(b.code));
    if (missing.length === 0) return { inserted: 0 };

    await Badge.bulkCreate(missing);
    logger.info(`Seeded ${missing.length} badge(s): ${missing.map((b) => b.code).join(", ")}`);
    return { inserted: missing.length };
}

export { BADGE_CATALOG };
export default seedBadges;
