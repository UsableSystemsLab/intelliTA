// MILESTONE_100 / 500 / 1000 / 5000 points
const THRESHOLDS = [
    { code: "MILESTONE_100", points: 100 },
    { code: "MILESTONE_500", points: 500 },
    { code: "MILESTONE_1000", points: 1000 },
    { code: "MILESTONE_5000", points: 5000 },
];

async function check(ctx) {
    const { prevTotalPoints, userPoints } = ctx;
    const current = userPoints?.total_points ?? 0;
    const prev = prevTotalPoints ?? 0;

    const awarded = [];
    for (const { code, points } of THRESHOLDS) {
        if (prev < points && current >= points) {
            awarded.push({ code, activity_id: null });
        }
    }
    return awarded.length ? awarded : null;
}

export default { code: "MILESTONES", check };
