import express from "express";
import ActivityController from "../controllers/activityController.js";
import { uploadActivityMulter, uploadActivityFilesToS3 } from "../middlewares/uploadActivityFiles.js";

const router = express.Router({ mergeParams: true });

router.post(
    "/",
    uploadActivityMulter,
    uploadActivityFilesToS3,
    ActivityController.createActivity
);

router.get("/", ActivityController.getActivitiesByCourse);

router.delete("/:activityId", ActivityController.deleteActivity);

export default router;
