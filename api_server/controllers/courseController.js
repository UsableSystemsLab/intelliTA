import { Course, Lab } from "../models/index.js";

const CourseController = {
  /**
   * @swagger
   * /courses:
   *   post:
   *     security:
   *       - bearerAuth: []
   *     summary: Create a new course
   *     tags: [Courses]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Course'
   *     responses:
   *       201:
   *         description: Course created successfully
   *       400:
   *         description: Invalid input
   */
  async createCourse(req, res) {
    try {
      const { title, course_code, description, instructor_id } = req.body;

      const newCourse = await Course.create({
        title,
        course_code,
        description,
        instructor_id, 
      });

      return res.status(201).json(newCourse);
    } catch (error) {
      return res.status(400).json({
        message: "Error creating course",
        error: error.message,
      });
    }
  },

  /**
   * @swagger
   * /courses:
   *   get:
   *     security:
   *       - bearerAuth: []
   *     summary: Get all courses
   *     tags: [Courses]
   *     responses:
   *       200:
   *         description: List of all courses
   *       500:
   *         description: Server error
   */
  async getAllCourses(req, res) {
    try {
      const courses = await Course.findAll({
        include: [
          {
            model: Lab,
            as: "labs",
          },
        ],
        order: [["created_at", "DESC"]],
      });

      return res.status(200).json(courses);
    } catch (error) {
      return res.status(500).json({
        message: "Error fetching courses",
        error: error.message,
      });
    }
  },

  /**
   * @swagger
   * /courses/{id}:
   *   get:
   *     security:
   *       - bearerAuth: []
   *     summary: Get a course by ID
   *     tags: [Courses]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Course ID
   *     responses:
   *       200:
   *         description: Course found
   *       404:
   *         description: Course not found
   */
  async getCourseById(req, res) {
    try {
      const { id } = req.params;

      const course = await Course.findByPk(id, {
        include: [
          {
            model: Lab,
            as: "labs",
          },
        ],
      });

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      return res.status(200).json(course);
    } catch (error) {
      return res.status(500).json({
        message: "Error fetching course",
        error: error.message,
      });
    }
  },

  /**
   * @swagger
   * /courses/{id}:
   *   put:
   *     security:
   *       - bearerAuth: []
   *     summary: Update a course
   *     tags: [Courses]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Course ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Course'
   *     responses:
   *       200:
   *         description: Course updated
   *       404:
   *         description: Course not found
   */
  async updateCourse(req, res) {
    try {
      const { id } = req.params;

      const [updated] = await Course.update(req.body, {
        where: { course_id: id },
      });

      if (!updated) {
        return res.status(404).json({ message: "Course not found" });
      }

      const updatedCourse = await Course.findByPk(id);
      return res.status(200).json(updatedCourse);
    } catch (error) {
      return res.status(400).json({
        message: "Error updating course",
        error: error.message,
      });
    }
  },

  /**
   * @swagger
   * /courses/{id}:
   *   delete:
   *     security:
   *       - bearerAuth: []
   *     summary: Delete a course
   *     tags: [Courses]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Course ID
   *     responses:
   *       204:
   *         description: Course deleted
   *       404:
   *         description: Course not found
   */
  async deleteCourse(req, res) {
    try {
      const { id } = req.params;

      const deleted = await Course.destroy({
        where: { course_id: id },
      });

      if (!deleted) {
        return res.status(404).json({ message: "Course not found" });
      }

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({
        message: "Error deleting course",
        error: error.message,
      });
    }
  },
};

export default CourseController;
