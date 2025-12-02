import { Course, Lab, Instructor, User } from "../models/index.js";

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
   *             properties:
   *               title:
   *                 type: string
   *               course_code:
   *                 type: string
   *               description:
   *                 type: string
   *               firebaseId:
   *                 type: string
   *                 description: The Firebase UID of the creator
   *     responses:
   *       201:
   *         description: Course created successfully
   *       400:
   *         description: Failed to create course
   */
  async createCourse(req, res) {
    try {
      const { title, course_code, description, firebaseId } = req.body;

      if (!firebaseId) {
        return res.status(400).json({ message: "firebaseId is required" });
      }

      // Find the user
      const user = await User.findOne({ where: { firebaseId } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Find or create Instructor profile for this user
      let instructor = await Instructor.findOne({ where: { user_id: user.id } });
      if (!instructor) {
        instructor = await Instructor.create({
          user_id: user.id,
          department: "General", // Default department
        });
      }

      // Create course
      const course = await Course.create({
        title,
        course_code,
        description,
      });

      // Assign this instructor to the course
      await course.addInstructor(instructor);

      // Fetch full course with instructors included
      const createdCourse = await Course.findByPk(course.course_id, {
        include: [
          {
            model: Instructor,
            as: "instructors",
            attributes: ["instructor_id", "user_id", "department"],
            through: { attributes: [] }, // hide pivot table
          },
        ],
      });

      return res.status(201).json(createdCourse);
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
   *     summary: Retrieve all courses
   *     description: Retrieve all courses. Optionally filter by userId or firebaseId to get courses created/taught by a specific user.
   *     tags: [Courses]
   *     parameters:
   *       - in: query
   *         name: userId
   *         schema:
   *           type: integer
   *         description: Filter by User ID (internal ID)
   *       - in: query
   *         name: firebaseId
   *         schema:
   *           type: string
   *         description: Filter by Firebase User ID
   *     responses:
   *       200:
   *         description: List of all courses
   *       500:
   *         description: Server error
   */
  async getAllCourses(req, res) {
    try {
      const { userId, firebaseId } = req.query;
      
      let filterUserId = userId;

      if (firebaseId) {
        const user = await User.findOne({ where: { firebaseId } });
        if (user) {
          filterUserId = user.id;
        } else {
          // User not found with that firebaseId
          return res.status(200).json([]);
        }
      }

      const includeOptions = [
        { model: Lab, as: "labs" },
        {
          model: Instructor,
          as: "instructors",
          attributes: ["instructor_id", "user_id", "department"],
          through: { attributes: [] },
        },
      ];

      if (filterUserId) {
        // Filter instructors to only include the one matching the user
        // This implicitly filters the courses to those taught by this user
        includeOptions[1].where = { user_id: filterUserId };
      }

      const courses = await Course.findAll({
        include: includeOptions,
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
          { model: Lab, as: "labs" },
          {
            model: Instructor,
            as: "instructors",
            attributes: ["instructor_id", "user_id", "department"],
            through: { attributes: [] },
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
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Course'
   *     responses:
   *       200:
   *         description: Course updated successfully
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
