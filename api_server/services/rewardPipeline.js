// Reward pipeline — single entry point used by the submission controller
import { sequelize } from "../configs/postgresDB.js";
import {
    Submission,
    SubmissionTestResult,
    ActivityTestCase,
    Activity,
    UserPoints,
    Badge,
    UserBadge,
    PointsLedger,
    Notification,
} from "../models/index.js";
import { calculatePoints } from "./pointsService.js";
import { checkAllBadges } from "./badgeService.js";

const MODELS = {
    Submission,
    SubmissionTestResult,
    ActivityTestCase,
    Activity,
    UserPoints,
    Badge,
    UserBadge,
    PointsLedger,
    Notification,
};


// Helpers
async function acquireUserLock(userId, txn) {
    await sequelize.query(
        "SELECT pg_advisory_xact_lock(hashtext(:key))",
        {
            replacements: { key: `reward_pipeline:${userId}` },
            transaction: txn,
        }
    );
}

async function findOrCreateUserPoints(userId, txn) {
    const [row] = await UserPoints.findOrCreate({
        where: { user_id: userId },
        defaults: { user_id: userId },
        transaction: txn,
        lock: txn.LOCK.UPDATE,
    });
    return row;
}

async function loadPriorPassedTestCaseIds(userId, activityId, submissionId, txn) {
    const rows = await SubmissionTestResult.findAll({
        attributes: ["test_case_id"],
        where: { passed: true },
        include: [
            {
                model: Submission,
                as: "submission",
                attributes: [],
                where: {
                    user_id: userId,
                    activity_id: activityId,
                    submission_id: { [sequelize.Sequelize.Op.ne]: submissionId },
                },
                required: true,
            },
        ],
        transaction: txn,
    });
    return new Set(rows.map((r) => r.test_case_id));
}

async function buildCachedResult(submissionId, userId, activityId, txn) {
    const ledger = await PointsLedger.findAll({
        where: { submission_id: submissionId },
        order: [["ledger_id", "ASC"]],
        transaction: txn,
    });
    const points_earned = ledger.reduce((s, l) => s + l.points, 0);

    const badges = await UserBadge.findAll({
        where: { user_id: userId, activity_id: activityId },
        include: [{ model: Badge, as: "badge" }],
        transaction: txn,
    });

    return {
        points_earned,
        lines: ledger.map((l) => ({ event_type: l.event_type, points: l.points })),
        badges_awarded: badges.map((b) => ({
            code: b.badge.code,
            name: b.badge.name,
            icon_url: b.badge.icon_url,
            tier: b.badge.tier,
            activity_id: b.activity_id,
        })),
        notifications: [],
        cached: true,
    };
}
// process — called after a submission + test results are persisted.
async function process({ submissionId, localHour, txn: outerTxn }) {
    const run = async (txn) => {
        const submission = await Submission.findByPk(submissionId, { transaction: txn });
        if (!submission) {
            const err = new Error(`Submission ${submissionId} not found`);
            err.status = 404;
            throw err;
        }

        await acquireUserLock(submission.user_id, txn);

        // already processed it. Return the cached aggregate.
        const existing = await PointsLedger.count({
            where: { submission_id: submissionId },
            transaction: txn,
        });
        if (existing > 0) {
            return buildCachedResult(
                submissionId,
                submission.user_id,
                submission.activity_id,
                txn
            );
        }

        const activity = await Activity.findByPk(submission.activity_id, { transaction: txn });
        const testResults = await SubmissionTestResult.findAll({
            where: { submission_id: submissionId },
            transaction: txn,
        });
        const priorPassedTestCaseIds = await loadPriorPassedTestCaseIds(
            submission.user_id,
            submission.activity_id,
            submissionId,
            txn
        );

        const userPoints = await findOrCreateUserPoints(submission.user_id, txn);
        const prevTotalPoints = userPoints.total_points;

        const { lines, total } = calculatePoints({
            submission,
            testResults,
            priorPassedTestCaseIds,
        });

        // Persist ledger rows. Unique partial index on (submission_id, event_type)
        const ledgerRows = [];
        for (const line of lines) {
            const [row] = await PointsLedger.findOrCreate({
                where: { submission_id: submissionId, event_type: line.event_type },
                defaults: {
                    user_id: submission.user_id,
                    submission_id: submissionId,
                    activity_id: submission.activity_id,
                    event_type: line.event_type,
                    points: line.points,
                    metadata: null,
                },
                transaction: txn,
            });
            ledgerRows.push(row);
        }

        if (total > 0) {
            userPoints.total_points += total;
            userPoints.last_activity_at = new Date();
        }
        await userPoints.save({ transaction: txn });

        // Badge checks — only when the student fully solved the activity.
        // Partial submissions earn points but never badges.
        let badgesAwarded = [];
        if (submission.status === "PASSED" && total > 0) {
            const ctx = {
                submission,
                activity,
                testResults,
                priorPassedTestCaseIds,
                localHour,
                userPoints,
                prevTotalPoints,
                txn,
                sequelize,
                models: MODELS,
            };
            const awards = await checkAllBadges(ctx);
            badgesAwarded = await persistBadges({
                awards,
                userId: submission.user_id,
                txn,
            });
        }

        const notifications = await emitNotifications({
            userId: submission.user_id,
            submissionId,
            total,
            badgesAwarded,
            txn,
        });

        return {
            points_earned: total,
            lines: lines.map((l) => ({ event_type: l.event_type, points: l.points })),
            badges_awarded: badgesAwarded.map((b) => ({
                code: b.code,
                name: b.name,
                icon_url: b.icon_url,
                tier: b.tier,
                activity_id: b.activity_id,
            })),
            notifications,
        };
    };

    if (outerTxn) return run(outerTxn);
    return sequelize.transaction(run);
}

async function persistBadges({ awards, userId, txn }) {
    if (!awards.length) return [];

    const codes = [...new Set(awards.map((a) => a.code))];
    const badgeRows = await Badge.findAll({
        where: { code: codes },
        transaction: txn,
    });
    const byCode = new Map(badgeRows.map((b) => [b.code, b]));

    const persisted = [];
    for (const award of awards) {
        const badge = byCode.get(award.code);
        if (!badge) continue;

        const [row, created] = await UserBadge.findOrCreate({
            where: {
                user_id: userId,
                badge_id: badge.badge_id,
                activity_id: award.activity_id ?? null,
            },
            defaults: {
                user_id: userId,
                badge_id: badge.badge_id,
                activity_id: award.activity_id ?? null,
            },
            transaction: txn,
        });
        if (!created) continue; // already had this badge — don't re-notify

        persisted.push({
            user_badge_id: row.user_badge_id,
            code: badge.code,
            name: badge.name,
            icon_url: badge.icon_url,
            tier: badge.tier,
            activity_id: row.activity_id,
        });
    }
    return persisted;
}

async function emitNotifications({ userId, submissionId, total, badgesAwarded, txn }) {
    const notifs = [];

    if (total > 0) {
        const row = await Notification.create(
            {
                user_id: userId,
                type: "POINTS_EARNED",
                title: `+${total} points!`,
                body: `You earned ${total} points on your latest submission.`,
                metadata: { submission_id: submissionId, points: total },
            },
            { transaction: txn }
        );
        notifs.push({
            id: row.notification_id,
            type: row.type,
            title: row.title,
            body: row.body,
        });
    }

    for (const b of badgesAwarded) {
        const row = await Notification.create(
            {
                user_id: userId,
                type: "BADGE_EARNED",
                title: `Badge unlocked: ${b.name}`,
                body: `You earned the ${b.name} badge.`,
                metadata: {
                    badge_code: b.code,
                    user_badge_id: b.user_badge_id,
                    activity_id: b.activity_id,
                },
            },
            { transaction: txn }
        );
        notifs.push({
            id: row.notification_id,
            type: row.type,
            title: row.title,
            body: row.body,
        });
    }

    return notifs;
}


// awardBugHunter, instructor gives this badge to the student 

async function awardBugHunter({ instructorId, userId, activityId = null, reason }) {
    return sequelize.transaction(async (txn) => {
        await acquireUserLock(userId, txn);

        const badge = await Badge.findOne({
            where: { code: "BUG_HUNTER" },
            transaction: txn,
        });
        if (!badge) {
            const err = new Error("BUG_HUNTER badge is not seeded");
            err.status = 500;
            throw err;
        }

        const [userBadge, created] = await UserBadge.findOrCreate({
            where: { user_id: userId, badge_id: badge.badge_id, activity_id: activityId },
            defaults: {
                user_id: userId,
                badge_id: badge.badge_id,
                activity_id: activityId,
                awarded_by_user_id: instructorId,
            },
            transaction: txn,
        });
        if (!created) {
            const err = new Error("User already has this Bug Hunter badge");
            err.status = 409;
            throw err;
        }

        await PointsLedger.create(
            {
                user_id: userId,
                submission_id: null,
                activity_id: activityId,
                event_type: "BUG_HUNTER_AWARD",
                points: 0,
                metadata: { instructor_id: instructorId, reason: reason || null },
            },
            { transaction: txn }
        );

        const notification = await Notification.create(
            {
                user_id: userId,
                type: "INSTRUCTOR_AWARD",
                title: `Bug Hunter awarded`,
                body:
                    reason ||
                    "An instructor awarded you the Bug Hunter badge for reporting an issue.",
                metadata: {
                    badge_code: "BUG_HUNTER",
                    instructor_id: instructorId,
                    activity_id: activityId,
                },
            },
            { transaction: txn }
        );

        return {
            badge: {
                code: badge.code,
                name: badge.name,
                icon_url: badge.icon_url,
                tier: badge.tier,
                activity_id: activityId,
                user_badge_id: userBadge.user_badge_id,
            },
            notification: {
                id: notification.notification_id,
                type: notification.type,
                title: notification.title,
                body: notification.body,
            },
        };
    });
}

export default { process, awardBugHunter };
export { process, awardBugHunter };
