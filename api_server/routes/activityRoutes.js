import express from "express";
import ActivityController from "../controllers/activityController.js";
import GitHubController from "../controllers/GitHubController.js";
import { uploadActivityMulter, uploadActivityFilesToS3 } from "../middlewares/uploadActivityFiles.js";
import QuizController from "../controllers/quizController.js";
import VideoProgressController from "../controllers/videoProgressController.js";
import StudentAnswerController from "../controllers/studentAnswerController.js";
import VideoChapterController from "../controllers/videoChapterController.js";
import RunController from "../controllers/runController.js";
import rateLimitRun from "../middlewares/rateLimitRun.js";

/**
 * @swagger
 * tags:
 *   name: Video Chapters
 *   description: Video chapters for activities
 */

/**
 * @swagger
 * /courses/{courseId}/activities/{activityId}/chapters:
 *   get:
 *     summary: Get all chapters for an activity
 *     tags: [Video Chapters]
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
 *         description: List of chapters ordered by start time
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chapters:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       start_time_seconds:
 *                         type: integer
 */

/**
 * @swagger
 * /courses/{courseId}/activities/{activityId}/chapters:
 *   post:
 *     summary: Set/replace all chapters for an activity
 *     tags: [Video Chapters]
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
 *             properties:
 *               chapters:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - title
 *                     - start_time_seconds
 *                   properties:
 *                     title:
 *                       type: string
 *                     start_time_seconds:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Chapters created
 *       404:
 *         description: Activity not found
 */

/**
 * @swagger
 * /courses/{courseId}/activities/{activityId}/chapters/{chapterId}:
 *   delete:
 *     summary: Delete a chapter
 *     tags: [Video Chapters]
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
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Chapter deleted
 *       404:
 *         description: Chapter not found
 */

const router = express.Router({ mergeParams: true });

router.use((req, res, next) => {
    console.log(`[ActivityRoutes] ${req.method} ${req.originalUrl} -> Path: ${req.path}`);
    next();
});

router.post(
    "/",
    uploadActivityMulter,
    uploadActivityFilesToS3,
    ActivityController.createActivity
);

router.get("/", ActivityController.getActivitiesByCourse);

router.get("/:activityId", ActivityController.getActivityById);

router.put(
    "/:activityId",
    uploadActivityMulter,
    uploadActivityFilesToS3,
    ActivityController.updateActivity
);

router.delete("/:activityId", ActivityController.deleteActivity);

router.post("/:activityId/submit", ActivityController.submitActivity);

// Link a GitHub Classroom assignment to this activity
router.patch("/:activityId/github-assignment", GitHubController.linkAssignment);

// Get acceptance tracking for this activity's GitHub Classroom assignment
router.get("/:activityId/github-acceptances", GitHubController.getAcceptances);

// Quiz questions
router.get("/:activityId/quiz", QuizController.getQuiz);
router.post("/:activityId/quiz", QuizController.setQuiz);

// Video progress
router.get("/:activityId/progress", VideoProgressController.getProgress);
router.put("/:activityId/progress", VideoProgressController.upsertProgress);
router.post("/:activityId/acknowledge-update", VideoProgressController.acknowledgeUpdate);

// Student answers
router.post("/:activityId/answers", StudentAnswerController.recordAnswer);
router.get("/:activityId/answers", StudentAnswerController.getAnswers);

// Code execution (Piston)
router.post("/:activityId/run", rateLimitRun, RunController.runCode);

// Video chapters
router.get("/:activityId/chapters", VideoChapterController.getChapters);
router.post("/:activityId/chapters", VideoChapterController.setChapters);
router.delete("/:activityId/chapters/:chapterId", VideoChapterController.deleteChapter);

export default router;
