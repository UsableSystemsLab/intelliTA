// EARLYBIRD — submission passed + this is the user's first pass on the
// activity + fewer than 3 OTHER users have already passed it.

import { Op } from "sequelize";

const CODE = "EARLYBIRD";
const MAX_PRIOR_PASSERS = 3;

async function check(ctx) {
    const { submission, activity, models, txn, sequelize } = ctx;
    if (submission.status !== "PASSED") return null;

    // Lock the activity row to serialize concurrent EARLYBIRD checks.
    await sequelize.query(
        "SELECT 1 FROM activities WHERE activity_id = :id FOR UPDATE",
        { replacements: { id: activity.activity_id }, transaction: txn }
    );

    // Has this user passed this activity before (in any earlier submission)?
    const priorOwnPass = await models.Submission.findOne({
        where: {
            user_id: submission.user_id,
            activity_id: activity.activity_id,
            status: "PASSED",
            submission_id: { [Op.ne]: submission.submission_id },
        },
        transaction: txn,
    });
    if (priorOwnPass) return null;

    // Count distinct OTHER users who have already passed this activity.
    const distinctOtherPassers = await models.Submission.count({
        where: {
            activity_id: activity.activity_id,
            status: "PASSED",
            user_id: { [Op.ne]: submission.user_id },
        },
        distinct: true,
        col: "user_id",
        transaction: txn,
    });

    if (distinctOtherPassers >= MAX_PRIOR_PASSERS) return null;

    return { code: CODE, activity_id: activity.activity_id };
}

export default { code: CODE, check };
