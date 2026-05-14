import express from "express";
import SubmissionController from "../controllers/submissionController.js";

const router = express.Router({ mergeParams: true });

router.post("/", SubmissionController.create);
router.get("/me", SubmissionController.listMine);

export default router;
