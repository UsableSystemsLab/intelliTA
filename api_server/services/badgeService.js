// Runs every registered badge checker and collects their awards.

import earlybird from "./badges/earlybird.js";
import nightOwl from "./badges/nightOwl.js";
import speedRunner from "./badges/speedRunner.js";
import lastMinutes from "./badges/lastMinutes.js";
import flawlessVictory from "./badges/flawlessVictory.js";
import milestones from "./badges/milestones.js";

const CHECKERS = [
    earlybird,
    nightOwl,
    speedRunner,
    lastMinutes,
    flawlessVictory,
    milestones,
];

async function checkAllBadges(ctx) {
    const awards = [];
    for (const checker of CHECKERS) {
        const result = await checker.check(ctx);
        if (!result) continue;
        if (Array.isArray(result)) {
            awards.push(...result);
        } else {
            awards.push(result);
        }
    }
    return awards;
}

export { checkAllBadges, CHECKERS };
