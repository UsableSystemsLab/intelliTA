// NIGHT_OWL — passed an activity with local hour in [0, 5).

const CODE = "NIGHT_OWL";

async function check(ctx) {
    const { submission, localHour } = ctx;
    if (submission.status !== "PASSED") return null;
    if (typeof localHour !== "number") return null;
    if (localHour < 0 || localHour >= 5) return null;
    return { code: CODE, activity_id: submission.activity_id };
}

export default { code: CODE, check };
