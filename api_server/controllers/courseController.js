import { Op } from "sequelize";
import { Course, Lab, User, Enrollment } from "../models/index.js";

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
      let { title, description, firebaseId, course_code, allowed_students } = req.body;

      if (!firebaseId) {
        return res.status(400).json({ message: "firebaseId is required" });
      }

      // Find the user
      const user = await User.findOne({ where: { firebaseId } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate a unique token
      const generateToken = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      let token = generateToken();
      let existingCourse = await Course.findOne({ where: { token } });
      while (existingCourse) {
        token = generateToken();
        existingCourse = await Course.findOne({ where: { token } });
      }

      // Create course
      const course = await Course.create({
        title,
        course_code,
        token,
        description,
        allowed_students: allowed_students || null,
        instructor_id: user.id
      });

      // Fetch full course including instructor details
      const createdCourse = await Course.findByPk(course.course_id, {
        include: [
          {
            model: User,
            as: "instructor",
            attributes: ["id", "first_name", "last_name", "email", "firebaseId"]
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
   * /courses/join:
   *   post:
   *     summary: Join a course via token
   *     tags: [Courses]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             properties:
   *               token:
   *                 type: string
   *               firebaseId:
   *                 type: string
   *               selected_name:
   *                 type: string
   *     responses:
   *       200:
   *         description: Successfully joined
   *       400:
   *         description: Already enrolled or invalid input
   *       403:
   *         description: Name selection required (returns available names)
   *       404:
   *         description: Course or User not found
   */
  async joinCourse(req, res) {
    try {
      const { token, firebaseId, selected_name } = req.body;

      if (!token || !firebaseId) {
        return res.status(400).json({ message: "Token and firebaseId are required" });
      }

      // Find user
      const user = await User.findOne({ where: { firebaseId } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Find course by token
      const course = await Course.findOne({ where: { token } });
      if (!course) {
        return res.status(404).json({ message: "Invalid course token" });
      }

      // Check if user is the instructor
      if (course.instructor_id === user.id) {
        return res.status(400).json({ message: "You cannot join a course you created." });
      }

      // Check if already enrolled
      const existingEnrollment = await Enrollment.findOne({
        where: {
          user_id: user.id,
          course_id: course.course_id,
        },
      });

      if (existingEnrollment) {
        return res.status(400).json({ message: "You are already enrolled in this course" });
      }

      // Name Selection
      if (course.allowed_students && Array.isArray(course.allowed_students) && course.allowed_students.length > 0) {
          // Get all current enrollments for this course that have a name taken
          const takenEnrollments = await Enrollment.findAll({
              where: { 
                  course_id: course.course_id,
                  enrolled_name: { [Op.ne]: null }
              }
          });
          
          const takenNames = takenEnrollments.map(e => e.enrolled_name);
          const availableNames = course.allowed_students.filter(name => !takenNames.includes(name));

          if (!selected_name) {
              // User hasn't picked a name yet, return list
              return res.status(403).json({ 
                  message: "Please select a name from the list", 
                  requires_name_selection: true,
                  available_names: availableNames 
              });
          }

          if (!availableNames.includes(selected_name)) {
               return res.status(400).json({ 
                  message: "Selected name is invalid or already joined",
                  available_names: availableNames 
               });
          }
      }

      // Create Enrollment
      await Enrollment.create({
        user_id: user.id,
        course_id: course.course_id,
        status: "active",
        enrolled_name: selected_name || user.email
      });

      return res.status(200).json({ message: "Successfully joined the course", course });
    } catch (error) {
      console.error("Join Course Error:", error);
      return res.status(500).json({
        message: "Error joining course: " + error.message,
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



      if (filterUserId) {
        // Fetch courses taught by user 
        const taughtCourses = await Course.findAll({
          where: { instructor_id: filterUserId },
          include: [{ model: Lab, as: "labs" }],
          order: [["created_at", "DESC"]],
        });

        // Fetch courses user is enrolled in
        const enrolledCourses = await Course.findAll({
             include: [
                 { model: Lab, as: "labs" },
                 {
                    model: User,
                    as: "students",
                    where: { id: filterUserId },
                    attributes: [], 
                    through: { attributes: [] }
                 },
                 {
                   model: User,
                   as: "instructor",
                   attributes: ["id", "first_name", "last_name"]
                 }
             ],
             order: [["created_at", "DESC"]]
        });

        // Combine and deduplicate if necessary
        const allCourses = [...taughtCourses, ...enrolledCourses];
        
        // Remove duplicates just in case (e.g. if instructor also enrolls? unlikely but safe)
        const uniqueCourses = Array.from(new Map(allCourses.map(c => [c.course_id, c])).values());

        return res.status(200).json(uniqueCourses);
      }
      // Fetch all courses (public/admin view)
      const courses = await Course.findAll({
        include: [
            { model: Lab, as: "labs" },
            {
                model: User,
                as: "instructor",
                attributes: ["id", "first_name", "last_name", "email", "firebaseId"]
            }
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
          { model: Lab, as: "labs" },
          {
            model: User,
            as: "instructor",
            attributes: ["id", "firebaseId", "first_name", "last_name", "email"]
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
  async regenerateToken(req, res) {
    try {
      const { id } = req.params;

      const generateToken = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      let token = generateToken();
      let existingCourse = await Course.findOne({ where: { token } });
      while (existingCourse) {
        token = generateToken();
        existingCourse = await Course.findOne({ where: { token } });
      }

      const [updated] = await Course.update({ token }, {
        where: { course_id: id },
      });

      if (!updated) {
        return res.status(404).json({ message: "Course not found" });
      }

      return res.status(200).json({ token });
    } catch (error) {
      return res.status(500).json({
        message: "Error regenerating token",
        error: error.message,
      });
    }
  },

  /**
   * @swagger
   * /courses/{id}/students:
   *   get:
   *     security:
   *       - bearerAuth: []
   *     summary: Get all enrolled students for a course
   *     tags: [Courses]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Course ID
   *       - in: query
   *         name: firebaseId
   *         required: true
   *         schema:
   *           type: string
   *         description: Firebase UID of the requesting user (must be instructor)
   *     responses:
   *       200:
   *         description: List of enrolled students
   *       403:
   *         description: Not authorized (not the instructor)
   *       404:
   *         description: Course not found
   */
  async getEnrolledStudents(req, res) {
    try {
      const { id } = req.params;
      const { firebaseId } = req.query;

      if (!firebaseId) {
        return res.status(400).json({ message: "firebaseId is required" });
      }

      // Find the requesting user
      const requestingUser = await User.findOne({ where: { firebaseId } });
      if (!requestingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Find the course
      const course = await Course.findByPk(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Check if the requesting user is the instructor
      if (course.instructor_id !== requestingUser.id) {
        return res.status(403).json({ message: "Only the course instructor can view enrolled students" });
      }

      // Fetch enrolled students with enrollment details
      const enrollments = await Enrollment.findAll({
        where: { course_id: id },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "first_name", "last_name", "email", "firebaseId"]
          }
        ],
        order: [["enrollment_date", "DESC"]]
      });

      // Format response
      const students = enrollments.map(enrollment => ({
        enrollment_id: enrollment.enrollment_id,
        user_id: enrollment.user_id,
        first_name: enrollment.user.first_name,
        last_name: enrollment.user.last_name,
        email: enrollment.user.email,
        enrolled_name: enrollment.enrolled_name,
        enrollment_date: enrollment.enrollment_date,
        status: enrollment.status,
        points: enrollment.points,
        grade: enrollment.grade
      }));

      return res.status(200).json(students);
    } catch (error) {
      return res.status(500).json({
        message: "Error fetching enrolled students",
        error: error.message,
      });
    }
  },

  /**
   * @swagger
   * /courses/{id}/students/{userId}:
   *   delete:
   *     security:
   *       - bearerAuth: []
   *     summary: Remove a student from a course
   *     tags: [Courses]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Course ID
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: integer
   *         description: User ID of the student to remove
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             properties:
   *               firebaseId:
   *                 type: string
   *                 description: Firebase UID of the requesting user (must be instructor)
   *     responses:
   *       200:
   *         description: Student removed successfully
   *       403:
   *         description: Not authorized (not the instructor)
   *       404:
   *         description: Course or enrollment not found
   */
  async removeStudent(req, res) {
    try {
      const { id, userId } = req.params;
      const { firebaseId } = req.body;

      if (!firebaseId) {
        return res.status(400).json({ message: "firebaseId is required" });
      }

      // Find the requesting user
      const requestingUser = await User.findOne({ where: { firebaseId } });
      if (!requestingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Find the course
      const course = await Course.findByPk(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Check if the requesting user is the instructor
      if (course.instructor_id !== requestingUser.id) {
        return res.status(403).json({ message: "Only the course instructor can remove students" });
      }

      // Find and delete the enrollment
      const deleted = await Enrollment.destroy({
        where: {
          course_id: id,
          user_id: userId
        }
      });

      if (!deleted) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      return res.status(200).json({ message: "Student removed successfully" });
    } catch (error) {
      return res.status(500).json({
        message: "Error removing student",
        error: error.message,
      });
    }
  },
};

export default CourseController;
