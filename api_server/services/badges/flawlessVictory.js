// FLAWLESS_VICTORY — passed on attempt 1 AND every test_case of the activity

const CODE = "FLAWLESS_VICTORY";

async function check(ctx) {
    const { submission, activity, testResults, models, txn } = ctx;
    if (submission.status !== "PASSED") return null;
    if (submission.attempt_number !== 1) return null;

    const totalTestCases = await models.ActivityTestCase.count({
        where: { activity_id: activity.activity_id },
        transaction: txn,
    });
    if (totalTestCases === 0) return null;

    const passedCount = (testResults || []).filter((r) => r.passed).length;
    if (passedCount < totalTestCases) return null;

    return { code: CODE, activity_id: activity.activity_id };
}

export default { code: CODE, check };
