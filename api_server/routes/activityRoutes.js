import express from "express";
import ActivityController from "../controllers/activityController.js";
import { uploadActivityMulter, uploadActivityFilesToS3 } from "../middlewares/uploadActivityFiles.js";
import QuizController from "../controllers/quizController.js";
import VideoProgressController from "../controllers/videoProgressController.js";
import StudentAnswerController from "../controllers/studentAnswerController.js";

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

// Quiz questions
router.get("/:activityId/quiz", QuizController.getQuiz);
router.post("/:activityId/quiz", QuizController.setQuiz);

// Video progress
router.get("/:activityId/progress", VideoProgressController.getProgress);
router.put("/:activityId/progress", VideoProgressController.upsertProgress);

// Student answers
router.post("/:activityId/answers", StudentAnswerController.recordAnswer);
router.get("/:activityId/answers", StudentAnswerController.getAnswers);

export default router;
