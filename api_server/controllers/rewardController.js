import { sequelize } from "../configs/postgresDB.js";
import UserPoints from "../models/UserPoints.js";
import Submission from "../models/Submission.js";
import Badge from "../models/Badge.js";
import UserBadge from "../models/UserBadge.js";
import PointsLedger from "../models/PointsLedger.js";
import Activity from "../models/Activity.js";
import rewardPipeline from "../services/rewardPipeline.js";
import { resolveUserParam } from "../utils/resolveUserParam.js";
import {
    encodeCursor,
    decodeCursor,
    cursorWhere,
    clampLimit,
} from "../utils/cursorPagination.js";

const RewardController = {
    async getRewards(req, res) {
        try {
            const userId = await resolveUserParam(req.params.userId);
            if (!Number.isInteger(userId)) {
                return res.status(400).json({ error: "Invalid user id" });
            }

            const points = await UserPoints.findByPk(userId);
            const completed = await Submission.count({
                distinct: true,
                col: "activity_id",
                where: { user_id: userId, status: "PASSED" },
            });
            const badgesEarned = await UserBadge.count({ where: { user_id: userId } });
            const badgesTotal = await Badge.count();

            return res.status(200).json({
                total_points: points ? points.total_points : 0,
                completed_activities: completed,
                badges_earned_count: badgesEarned,
                badges_total_count: badgesTotal,
            });
        } catch (err) {
            console.error("getRewards error:", err);
            return res.status(500).json({ error: "Failed to load rewards" });
        }
    },

    async getRewardsHistory(req, res) {
        try {
            const userId = await resolveUserParam(req.params.userId);
            if (!Number.isInteger(userId)) {
                return res.status(400).json({ error: "Invalid user id" });
            }
            const limit = clampLimit(req.query.limit);
            const cursor = decodeCursor(req.query.cursor);

            const where = {
                user_id: userId,
                ...cursorWhere(cursor, "created_at", "ledger_id"),
            };

            const rows = await PointsLedger.findAll({
                where,
                order: [["created_at", "DESC"], ["ledger_id", "DESC"]],
                limit: limit + 1,
            });

            const hasMore = rows.length > limit;
            const page = hasMore ? rows.slice(0, limit) : rows;
            const last = page[page.length - 1];
            const nextCursor = hasMore && last
                ? encodeCursor(last.created_at, last.ledger_id)
                : null;

            return res.status(200).json({
                items: page.map((l) => ({
                    ledger_id: l.ledger_id,
                    event_type: l.event_type,
                    points: l.points,
                    submission_id: l.submission_id,
                    activity_id: l.activity_id,
                    metadata: l.metadata,
                    created_at: l.created_at,
                })),
                next_cursor: nextCursor,
            });
        } catch (err) {
            console.error("getRewardsHistory error:", err);
            return res.status(500).json({ error: "Failed to load rewards history" });
        }
    },

    async getBadges(req, res) {
        try {
            const userId = await resolveUserParam(req.params.userId);
            if (!Number.isInteger(userId)) {
                return res.status(400).json({ error: "Invalid user id" });
            }

            const earned = await UserBadge.findAll({
                where: { user_id: userId },
                include: [
                    { model: Badge, as: "badge" },
                    { model: Activity, as: "activity", attributes: ["activity_id", "title"] },
                ],
                order: [["awarded_at", "DESC"]],
            });
            const earnedBadgeIds = new Set(earned.map((u) => u.badge.badge_id));
            const all = await Badge.findAll();
            const locked = all.filter((b) => !earnedBadgeIds.has(b.badge_id));

            return res.status(200).json({
                earned: earned.map((u) => ({
                    code: u.badge.code,
                    name: u.badge.name,
                    icon_url: u.badge.icon_url,
                    tier: u.badge.tier,
                    awarded_at: u.awarded_at,
                    activity_id: u.activity_id,
                    activity_title: u.activity ? u.activity.title : null,
                })),
                locked: locked.map((b) => ({
                    code: b.code,
                    name: b.name,
                    description: b.description,
                    icon_url: b.icon_url,
                    tier: b.tier,
                })),
            });
        } catch (err) {
            console.error("getBadges error:", err);
            return res.status(500).json({ error: "Failed to load badges" });
        }
    },

    async awardBugHunter(req, res) {
        try {
            const { user_id: userId, activity_id: activityId = null, reason } = req.body || {};
            if (!Number.isInteger(userId)) {
                return res.status(400).json({ error: "user_id is required" });
            }
            const instructorId = req.callerUserId;

            const result = await rewardPipeline.awardBugHunter({
                instructorId,
                userId,
                activityId,
                reason,
            });
            return res.status(201).json(result);
        } catch (err) {
            const status = err.status || 500;
            if (status === 500) console.error("awardBugHunter error:", err);
            return res.status(status).json({ error: err.message || "Failed to award badge" });
        }
    },
};

// Surface sequelize so model-mocked tests still have something to reference if needed.
export { sequelize };
export default RewardController;
