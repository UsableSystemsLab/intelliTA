import express from "express";
import CourseController from "../controllers/courseController.js";

const router = express.Router();

router.post("/", CourseController.createCourse);
router.get("/", CourseController.getAllCourses);
router.get("/:id", CourseController.getCourseById);
router.put("/:id", CourseController.updateCourse);
router.delete("/:id", CourseController.deleteCourse);

export default router;
