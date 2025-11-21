import { Lab, Course } from "../models/index.js";

const LabController = {
  /**
   * @swagger
   * /courses/{courseId}/labs:
   *   post:
   *     security:
   *       - bearerAuth: []
   *     summary: Create a new lab for a course
   *     tags: [Labs]
   *     description: Create a new lab with optional video upload or markdown content.
   *     parameters:
   *       - in: path
   *         name: courseId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the course
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               type:
   *                 type: string
   *                 enum: [video, markdown]
   *               markdown_text:
   *                 type: string
   *               video:
   *                 type: string
   *                 format: binary
   *     responses:
   *       201:
   *         description: Lab created successfully
   *       400:
   *         description: Invalid input
   */
  async createLab(req, res) {
    try {
      const { courseId } = req.params;
      const { title, type, markdown_text } = req.body;

     
      const course = await Course.findByPk(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      let video_url = null;

      if (type === "video") {
        if (!req.file) {
          return res.status(400).json({ message: "Video file is required for video labs" });
        }
        video_url = req.file.location; // S3 public URL
      }

      const newLab = await Lab.create({
        course_id: courseId,
        title,
        type,
        video_url,
        markdown_text: type === "markdown" ? markdown_text : null,
      });

      res.status(201).json(newLab);
    } catch (error) {
      res.status(400).json({
        message: "Error creating lab",
        error: error.message,
      });
    }
  },

  /**
   * @swagger
   * /courses/{courseId}/labs:
   *   get:
   *     security:
   *       - bearerAuth: []
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
   *       404:
   *         description: Course not found
   */
  async getLabsByCourse(req, res) {
    try {
      const { courseId } = req.params;

      const labs = await Lab.findAll({
        where: { course_id: courseId },
        order: [["created_at", "ASC"]],
      });

      res.status(200).json(labs);
    } catch (error) {
      res.status(500).json({
        message: "Error fetching labs",
        error: error.message,
      });
    }
  },

  /**
   * @swagger
   * /labs/{labId}:
   *   get:
   *     security:
   *       - bearerAuth: []
   *     summary: Get a single lab by ID
   *     tags: [Labs]
   *     parameters:
   *       - in: path
   *         name: labId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lab found
   *       404:
   *         description: Lab not found
   */
  async getLabById(req, res) {
    try {
      const { labId } = req.params;

      const lab = await Lab.findByPk(labId);

      if (!lab) return res.status(404).json({ message: "Lab not found" });

      res.status(200).json(lab);
    } catch (error) {
      res.status(500).json({
        message: "Error fetching lab",
        error: error.message,
      });
    }
  },

  /**
   * @swagger
   * /labs/{labId}:
   *   put:
   *     security:
   *       - bearerAuth: []
   *     summary: Update a lab
   *     tags: [Labs]
   *     parameters:
   *       - in: path
   *         name: labId
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Lab'
   *     responses:
   *       200:
   *         description: Lab updated successfully
   *       404:
   *         description: Lab not found
   */
  async updateLab(req, res) {
    try {
      const { labId } = req.params;

      const [updated] = await Lab.update(req.body, {
        where: { lab_id: labId },
      });

      if (!updated) {
        return res.status(404).json({ message: "Lab not found" });
      }

      const updatedLab = await Lab.findByPk(labId);
      res.status(200).json(updatedLab);
    } catch (error) {
      res.status(400).json({
        message: "Error updating lab",
        error: error.message,
      });
    }
  },

  /**
   * @swagger
   * /labs/{labId}:
   *   delete:
   *     security:
   *       - bearerAuth: []
   *     summary: Delete a lab
   *     tags: [Labs]
   *     parameters:
   *       - in: path
   *         name: labId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       204:
   *         description: Lab deleted successfully
   *       404:
   *         description: Lab not found
   */
  async deleteLab(req, res) {
    try {
      const { labId } = req.params;

      const deleted = await Lab.destroy({
        where: { lab_id: labId },
      });

      if (!deleted) {
        return res.status(404).json({ message: "Lab not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        message: "Error deleting lab",
        error: error.message,
      });
    }
  },
};

export default LabController;