// SPEED_RUNNER — passed on attempt 1 in under 15 minutes of active time.

const CODE = "SPEED_RUNNER";
const MAX_ACTIVE_SECONDS = 15 * 60;

async function check(ctx) {
    const { submission } = ctx;
    if (submission.status !== "PASSED") return null;
    if (submission.attempt_number !== 1) return null;
    if (submission.active_seconds >= MAX_ACTIVE_SECONDS) return null;
    return { code: CODE, activity_id: submission.activity_id };
}

export default { code: CODE, check };
