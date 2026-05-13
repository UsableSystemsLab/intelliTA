// LAST_MINUTES — passed within the final hour before the activity's end_date.

const CODE = "LAST_MINUTES";
const ONE_HOUR_MS = 60 * 60 * 1000;

async function check(ctx) {
    const { submission, activity } = ctx;
    if (submission.status !== "PASSED") return null;
    if (!activity?.end_date) return null;

    const end = new Date(activity.end_date).getTime();
    const submittedAt = new Date(submission.created_at || Date.now()).getTime();
    const delta = end - submittedAt;

    if (delta < 0 || delta > ONE_HOUR_MS) return null;
    return { code: CODE, activity_id: activity.activity_id };
}

export default { code: CODE, check };
