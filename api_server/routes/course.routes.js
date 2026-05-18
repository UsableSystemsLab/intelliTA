import express from "express";
import CourseController from "../controllers/courseController.js";

const router = express.Router();

router.post("/", CourseController.createCourse);
router.post("/join", CourseController.joinCourse);
router.get("/", CourseController.getAllCourses);
router.get("/:id", CourseController.getCourseById);
router.post("/:id/code", CourseController.regenerateToken);
router.put("/:id", CourseController.updateCourse);
router.delete("/:id", CourseController.deleteCourse);
router.get("/:id/students", CourseController.getEnrolledStudents);
router.get("/:id/leaderboard", CourseController.getCourseLeaderboard);
router.delete("/:id/students/:userId", CourseController.removeStudent);

export default router;
