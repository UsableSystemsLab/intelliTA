import express from "express";
import NotificationController from "../controllers/notificationController.js";
import { requireSelf } from "../middlewares/requireSelf.js";

const router = express.Router();

const targetFromParams = (req) => parseInt(req.params.userId, 10);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app notifications for points, badges, and instructor awards
 */

/**
 * @swagger
 * /users/{userId}/notifications:
 *   get:
 *     summary: List the caller's notifications (paginated, newest first)
 *     description: Caller must be the target user.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *       - in: query
 *         name: unread_only
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Page of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       type:
 *                         type: string
 *                         enum: [POINTS_EARNED, BADGE_EARNED, INSTRUCTOR_AWARD]
 *                       title:
 *                         type: string
 *                       body:
 *                         type: string
 *                       metadata:
 *                         type: object
 *                         nullable: true
 *                       is_read:
 *                         type: boolean
 *                       read_at:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 next_cursor:
 *                   type: string
 *                   nullable: true
 */
router.get(
    "/users/:userId/notifications",
    requireSelf(targetFromParams),
    NotificationController.list,
);

/**
 * @swagger
 * /users/{userId}/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count for the caller
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Unread count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 */
router.get(
    "/users/:userId/notifications/unread-count",
    requireSelf(targetFromParams),
    NotificationController.unreadCount,
);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: The updated notification
 *       403:
 *         description: Forbidden (not the owner)
 *       404:
 *         description: Notification not found
 */
router.patch("/notifications/:id/read", NotificationController.markRead);

/**
 * @swagger
 * /notifications/read-all:
 *   post:
 *     summary: Mark all of the caller's notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Number of rows updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updated_count:
 *                   type: integer
 */
router.post("/notifications/read-all", NotificationController.markAllRead);

export default router;
