import { Instructor, User, Course } from "../models/index.js";

const InstructorController = {
  /**
   * @swagger
   * /instructors:
   *   post:
   *     security:
   *       - bearerAuth: []
   *     summary: Create a new instructor
   *     description: Create a new instructor and the associated user.
   *     tags: [Instructors]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               firebaseId:
   *                 type: string
   *               first_name:
   *                 type: string
   *               last_name:
   *                 type: string
   *               email:
   *                 type: string
   *               department:
   *                 type: string
   *     responses:
   *       201:
   *         description: Instructor created successfully
   *       400:
   *         description: Bad request
   */
  async createInstructor(req, res) {
    try {
      const { firebaseId, first_name, last_name, email, department } = req.body;

      // Check if user already exists
      let user = await User.findOne({ where: { email } });
      if (!user) {
        user = await User.create({
          firebaseId,
          first_name,
          last_name,
          email,
        });
      }

      const newInstructor = await Instructor.create({
        user_id: user.id,
        department,
      });

      res.status(201).json({ ...newInstructor.toJSON(), user });
    } catch (error) {
      res
        .status(400)
        .json({ message: "Error creating instructor", error: error.message });
    }
  },

  /**
   * @swagger
   * /instructors:
   *   get:
   *     security:
   *       - bearerAuth: []
   *     summary: Get all instructors
   *     description: Retrieve a list of all instructors including their user details.
   *     tags: [Instructors]
   *     responses:
   *       200:
   *         description: A list of instructors
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Instructor'
   *       500:
   *         description: Error fetching instructors
   */
  async getAllInstructors(req, res) {
    try {
      const instructors = await Instructor.findAll({
        include: [
          {
            model: User,
          },
        ],
      });
      res.status(200).json(instructors);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching instructors", error: error.message });
    }
  },

  /**
   * @swagger
   * /instructors/{instructorId}/courses:
   *   get:
   *     security:
   *       - bearerAuth: []
   *     summary: Get courses by instructor
   *     description: Retrieve all courses taught by a specific instructor.
   *     tags: [Instructors]
   *     parameters:
   *       - in: path
   *         name: instructorId
   *         required: true
   *         schema:
   *           type: integer
   *         description: The instructor ID
   *     responses:
   *       200:
   *         description: A list of courses
   *       404:
   *         description: Instructor not found
   */
  async getCoursesByInstructor(req, res) {
    try {
      const { instructorId } = req.params;
      const instructor = await Instructor.findByPk(instructorId, {
        include: [
          {
            model: Course,
            as: "courses",
            through: { attributes: [] }, // Exclude join table attributes
          },
        ],
      });

      if (!instructor) {
        return res.status(404).json({ message: "Instructor not found" });
      }

      res.status(200).json(instructor.courses);
    } catch (error) {
      res.status(500).json({
        message: "Error fetching courses for instructor",
        error: error.message,
      });
    }
  },
};

export default InstructorController;
