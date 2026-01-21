import Activity from "../models/Activity.js";

const ActivityController = {
  async createActivity(req, res) {
    try {
      const { courseId } = req.params;
      console.log("CreateActivity - Params:", req.params);
      console.log("CreateActivity - Body:", req.body);

      if (!courseId) {
          return res.status(400).json({ message: "Course ID is missing. Ensure the route is configured with mergeParams." });
      }

      const { title, start_date, end_date, video_url } = req.body;
      const md_file_url = req.body.md_file_url;

      // Basic validation
      if (!title || !start_date || !end_date) {
        return res.status(400).json({ message: "Title, Start Date, and End Date are required" });
      }

      const newActivity = await Activity.create({
        course_id: courseId,
        title,
        start_date,
        end_date,
        video_url: video_url || null,
        md_file_url: md_file_url || null,
      });

      res.status(201).json(newActivity);
    } catch (error) {
      console.error("Create Activity Error:", error);
      res.status(500).json({ message: "Failed to create activity", error: error.message });
    }
  },

  async getActivitiesByCourse(req, res) {
    try {
        const { courseId } = req.params;
        const activities = await Activity.findAll({
            where: { course_id: courseId },
            order: [['start_date', 'ASC']]
        });
        res.json(activities);
    } catch (error) {
        console.error("Get Activities Error:", error);
        res.status(500).json({ message: "Failed to fetch activities" });
    }
  },

  async deleteActivity(req, res) {
    try {
        const { activityId } = req.params;
        const result = await Activity.destroy({
            where: { activity_id: activityId }
        });

        if (result === 0) {
            return res.status(404).json({ message: "Activity not found" });
        }

        res.status(200).json({ message: "Activity deleted successfully" });
    } catch (error) {
        console.error("Delete Activity Error:", error);
        res.status(500).json({ message: "Failed to delete activity" });
    }
  }
};

export default ActivityController;
