import express from "express";
import SubmissionController from "../controllers/submissionController.js";

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Submissions
 *   description: Activity submissions and the rewards earned from them
 */

/**
 * @swagger
 * /courses/{courseId}/activities/{activityId}/submissions:
 *   post:
 *     summary: Create a submission for an activity and run the reward pipeline
 *     description: |
 *       Grades the submission against the activity's test cases (code via Piston outcomes and quiz answers),
 *       persists the submission + test results, then triggers `rewardPipeline.process` which:
 *       awards BASE points, applies NO_HINT_BONUS / HINT_PENALTY, checks all badge rules, and emits
 *       POINTS_EARNED / BADGE_EARNED notifications. Caller must be enrolled in the course.
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [started_at]
 *             properties:
 *               started_at:
 *                 type: string
 *                 format: date-time
 *               active_seconds:
 *                 type: integer
 *                 default: 0
 *               hints_used:
 *                 type: integer
 *                 default: 0
 *               local_hour:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 23
 *                 description: Student's local hour (0-23) at submit time. Used by the NIGHT_OWL badge.
 *               code_test_outcomes:
 *                 type: array
 *                 description: Per-Piston-test pass/fail outcomes keyed by external_ref.
 *                 items:
 *                   type: object
 *                   properties:
 *                     external_ref:
 *                       type: string
 *                     passed:
 *                       type: boolean
 *               quiz_answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question_id:
 *                       type: integer
 *                     answer:
 *                       description: Submitted answer (shape depends on question type).
 *     responses:
 *       201:
 *         description: Submission persisted and rewards computed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 submission:
 *                   type: object
 *                   properties:
 *                     submission_id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       enum: [PASSED, FAILED]
 *                     score:
 *                       type: integer
 *                     attempt_number:
 *                       type: integer
 *                 test_results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       test_case_id:
 *                         type: integer
 *                       passed:
 *                         type: boolean
 *                       points_awarded:
 *                         type: integer
 *                 rewards:
 *                   type: object
 *                   properties:
 *                     points_earned:
 *                       type: integer
 *                     lines:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           event_type:
 *                             type: string
 *                           points:
 *                             type: integer
 *                     badges_awarded:
 *                       type: array
 *                       items:
 *                         type: object
 *                     notifications:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Invalid courseId/activityId or missing started_at
 *       401:
 *         description: Caller not registered
 *       403:
 *         description: Not enrolled in this course
 */
router.post("/", SubmissionController.create);

/**
 * @swagger
 * /courses/{courseId}/activities/{activityId}/submissions/me:
 *   get:
 *     summary: List the caller's submissions for an activity (history view)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Submissions for the caller on this activity, newest first
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
 *                       submission_id:
 *                         type: integer
 *                       status:
 *                         type: string
 *                         enum: [PASSED, FAILED]
 *                       score:
 *                         type: integer
 *                       attempt_number:
 *                         type: integer
 *                       active_seconds:
 *                         type: integer
 *                       hints_used:
 *                         type: integer
 *                       started_at:
 *                         type: string
 *                         format: date-time
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       test_results:
 *                         type: array
 *                         items:
 *                           type: object
 */
router.get("/me", SubmissionController.listMine);

export default router;
