import Notification from "../models/Notification.js";
import { resolveCallerUserId } from "../utils/resolveCaller.js";
import { resolveUserParam } from "../utils/resolveUserParam.js";
import {
    encodeCursor,
    decodeCursor,
    cursorWhere,
    clampLimit,
} from "../utils/cursorPagination.js";

function serialize(n) {
    return {
        id: n.notification_id,
        type: n.type,
        title: n.title,
        body: n.body,
        metadata: n.metadata,
        is_read: n.is_read,
        read_at: n.read_at,
        created_at: n.created_at,
    };
}

const NotificationController = {
    async list(req, res) {
        try {
            const userId = await resolveUserParam(req.params.userId);
            if (!Number.isInteger(userId)) {
                return res.status(400).json({ error: "Invalid user id" });
            }
            const limit = clampLimit(req.query.limit);
            const cursor = decodeCursor(req.query.cursor);
            const unreadOnly = req.query.unread_only === "true";

            const where = { user_id: userId, ...cursorWhere(cursor, "created_at", "notification_id") };
            if (unreadOnly) where.is_read = false;

            const rows = await Notification.findAll({
                where,
                order: [["created_at", "DESC"], ["notification_id", "DESC"]],
                limit: limit + 1,
            });

            const hasMore = rows.length > limit;
            const page = hasMore ? rows.slice(0, limit) : rows;
            const last = page[page.length - 1];
            const nextCursor = hasMore && last
                ? encodeCursor(last.created_at, last.notification_id)
                : null;

            return res.status(200).json({
                items: page.map(serialize),
                next_cursor: nextCursor,
            });
        } catch (err) {
            console.error("Notification list error:", err);
            return res.status(500).json({ error: "Failed to load notifications" });
        }
    },

    async unreadCount(req, res) {
        try {
            const userId = await resolveUserParam(req.params.userId);
            if (!Number.isInteger(userId)) {
                return res.status(400).json({ error: "Invalid user id" });
            }
            const count = await Notification.count({
                where: { user_id: userId, is_read: false },
            });
            return res.status(200).json({ count });
        } catch (err) {
            console.error("Notification unread-count error:", err);
            return res.status(500).json({ error: "Failed to load unread count" });
        }
    },

    async markRead(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            if (!Number.isInteger(id)) {
                return res.status(400).json({ error: "Invalid notification id" });
            }

            const callerId = await resolveCallerUserId(req);
            if (!callerId) return res.status(401).json({ error: "Caller not registered" });

            const row = await Notification.findByPk(id);
            if (!row) return res.status(404).json({ error: "Notification not found" });
            if (row.user_id !== callerId) {
                return res.status(403).json({ error: "Forbidden" });
            }

            if (!row.is_read) {
                row.is_read = true;
                row.read_at = new Date();
                await row.save();
            }
            return res.status(200).json(serialize(row));
        } catch (err) {
            console.error("Notification markRead error:", err);
            return res.status(500).json({ error: "Failed to mark notification read" });
        }
    },

    async markAllRead(req, res) {
        try {
            const callerId = await resolveCallerUserId(req);
            if (!callerId) return res.status(401).json({ error: "Caller not registered" });

            const [affected] = await Notification.update(
                { is_read: true, read_at: new Date() },
                { where: { user_id: callerId, is_read: false } }
            );
            return res.status(200).json({ updated_count: affected });
        } catch (err) {
            console.error("Notification markAllRead error:", err);
            return res.status(500).json({ error: "Failed to mark all read" });
        }
    },
};

export default NotificationController;
