import express from "express";
import RewardController from "../controllers/rewardController.js";
import { requireSelfOrInstructorOf } from "../middlewares/requireSelfOrInstructorOf.js";
import { requireInstructor } from "../middlewares/requireInstructor.js";

const router = express.Router();

const targetFromParams = (req) => parseInt(req.params.userId, 10);

/**
 * @swagger
 * tags:
 *   - name: Rewards
 *     description: User points, streaks, and rewards history
 *   - name: Badges
 *     description: Badge catalog and per-user badge awards
 */

/**
 * @swagger
 * /users/{userId}/rewards:
 *   get:
 *     summary: Get a user's reward summary (points, streaks, badge counts)
 *     description: Caller must be the target user, or an instructor of any course the user is enrolled in.
 *     tags: [Rewards]
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
 *         description: Reward summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_points:
 *                   type: integer
 *                   example: 1240
 *                 completed_activities:
 *                   type: integer
 *                   example: 12
 *                 badges_earned_count:
 *                   type: integer
 *                   example: 5
 *                 badges_total_count:
 *                   type: integer
 *                   example: 10
 *       401:
 *         description: Caller not registered
 *       403:
 *         description: Forbidden
 */
router.get(
    "/users/:userId/rewards",
    requireSelfOrInstructorOf(targetFromParams),
    RewardController.getRewards,
);

/**
 * @swagger
 * /users/{userId}/rewards/history:
 *   get:
 *     summary: Paginated points-ledger history for a user
 *     description: Returns ledger entries (BASE, NO_HINT_BONUS, HINT_PENALTY, BUG_HUNTER_AWARD, etc.) newest-first using opaque cursor pagination.
 *     tags: [Rewards]
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
 *         description: Opaque cursor returned from a previous response as `next_cursor`.
 *     responses:
 *       200:
 *         description: Page of ledger entries
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
 *                       ledger_id:
 *                         type: integer
 *                       event_type:
 *                         type: string
 *                         enum: [BASE, NO_HINT_BONUS, HINT_PENALTY, STREAK_BONUS, BUG_HUNTER_AWARD]
 *                       points:
 *                         type: integer
 *                       submission_id:
 *                         type: integer
 *                         nullable: true
 *                       activity_id:
 *                         type: integer
 *                         nullable: true
 *                       metadata:
 *                         type: object
 *                         nullable: true
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 next_cursor:
 *                   type: string
 *                   nullable: true
 */
router.get(
    "/users/:userId/rewards/history",
    requireSelfOrInstructorOf(targetFromParams),
    RewardController.getRewardsHistory,
);

/**
 * @swagger
 * /users/{userId}/badges:
 *   get:
 *     summary: Get a user's earned + locked badges
 *     description: Badges are public on a user's profile (still behind the global Firebase auth).
 *     tags: [Badges]
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
 *         description: Earned and locked badge lists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 earned:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       icon_url:
 *                         type: string
 *                       tier:
 *                         type: string
 *                         enum: [BRONZE, SILVER, GOLD]
 *                       awarded_at:
 *                         type: string
 *                         format: date-time
 *                       activity_id:
 *                         type: integer
 *                         nullable: true
 *                       activity_title:
 *                         type: string
 *                         nullable: true
 *                 locked:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       icon_url:
 *                         type: string
 *                       tier:
 *                         type: string
 */
router.get("/users/:userId/badges", RewardController.getBadges);

/**
 * @swagger
 * /badges/bug-hunter:
 *   post:
 *     summary: Award the Bug Hunter badge to a student (instructor-only)
 *     description: Manually awards the BUG_HUNTER badge. Inserts a UserBadge, a `BUG_HUNTER_AWARD` ledger row (0 points, audit only), and an `INSTRUCTOR_AWARD` notification.
 *     tags: [Badges]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id]
 *             properties:
 *               user_id:
 *                 type: integer
 *               activity_id:
 *                 type: integer
 *                 nullable: true
 *               reason:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Badge awarded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 badge:
 *                   type: object
 *                 notification:
 *                   type: object
 *       400:
 *         description: Missing or invalid user_id
 *       403:
 *         description: Instructor role required
 *       409:
 *         description: User already has this Bug Hunter badge
 */
router.post("/badges/bug-hunter", requireInstructor, RewardController.awardBugHunter);

export default router;
