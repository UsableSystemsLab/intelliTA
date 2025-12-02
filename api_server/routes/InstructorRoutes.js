import express from "express";
import InstructorController from "../controllers/InstructorController.js";

const router = express.Router();

router.post("/", InstructorController.createInstructor);
router.get("/", InstructorController.getAllInstructors);
router.get("/:instructorId/courses", InstructorController.getCoursesByInstructor);

export default router;
