import express from "express";
import LabController from "../controllers/labController.js";
import { uploadVideo,uploadToS3  } from "../middlewares/uploadToS3.js";
/**
 * @swagger
 * tags:
 *   name: Labs
 *   description: Lab management endpoints
 */

/**
 * @swagger
 * /courses/{courseId}/labs:
 *   post:
 *     summary: Create a new lab
 *     tags: [Labs]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: formData
 *         name: title
 *         type: string
 *         required: true
 *       - in: formData
 *         name: type
 *         type: string
 *         enum: [video, markdown]
 *         required: true
 *       - in: formData
 *         name: markdown_text
 *         type: string
 *       - in: formData
 *         name: video
 *         type: file
 *     responses:
 *       201:
 *         description: Lab created
 */

/**
 * @swagger
 * /courses/{courseId}/labs:
 *   get:
 *     summary: Get all labs for a course
 *     tags: [Labs]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of labs
 */

/**
 * @swagger
 * /courses/{courseId}/labs/{labId}:
 *   get:
 *     summary: Get a lab by ID
 *     tags: [Labs]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: labId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lab details
 */

/**
 * @swagger
 * /courses/{courseId}/labs/{labId}:
 *   delete:
 *     summary: Delete a lab
 *     tags: [Labs]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *       - in: path
 *         name: labId
 *         required: true
 *     responses:
 *       200:
 *         description: Lab deleted
 */


const router = express.Router({ mergeParams: true });

router.post(
  "/",
  uploadVideo.single("video"),
  uploadToS3,
  LabController.createLab
);


router.get("/", LabController.getLabsByCourse);
router.get("/:labId", LabController.getLabById);
router.put("/:labId", LabController.updateLab);
router.delete("/:labId", LabController.deleteLab);

export default router;
