import UserRoutes from "./UserRoutes.js";
import LabRoutes from "./lab.routes.js"; 
import CourseRoutes from "./course.routes.js";
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

  // Course routes
  router.use("/courses", CourseRoutes);

  // Lab routes 
  router.use("/courses/:courseId/labs", LabRoutes);

  router.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
  });
};
export default apiRoutes;