import express from "express";
import ActivityController from "../controllers/activityController.js";
import { uploadActivityMulter, uploadActivityFilesToS3 } from "../middlewares/uploadActivityFiles.js";

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

router.delete("/:activityId", ActivityController.deleteActivity);

export default router;
