import UserRoutes from "./UserRoutes.js";
import LabRoutes from "./lab.routes.js";
import CourseRoutes from "./course.routes.js";
import ActivityRoutes from "./activityRoutes.js";
import UserApiKeyRoutes from "./UserApiKeyRoutes.js";
import TranscriptRoutes from "./transcript.routes.js";

const apiRoutes = (router) => {
  /**
   * @swagger
   * /health:
   *   get:
   *     security:
   *       - bearerAuth: []
   *     summary: Health check endpoint
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Returns the health status of the API
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: Healthy
   */

  router.get("/health", (req, res) => {
    res.status(200).json({ status: "Healthy" });
  });

  router.use("/users", UserRoutes);
  router.use("/users/:firebaseUid/api-keys", UserApiKeyRoutes);

  // Activity routes
  router.use("/courses/:courseId/activities", ActivityRoutes);

  // Lab routes 
  router.use("/courses/:courseId/labs", LabRoutes);

  // Course routes
  router.use("/courses", CourseRoutes);

  // Transcript routes
  router.use("/transcripts", TranscriptRoutes);

  router.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
  });
};
export default apiRoutes;