import Activity from "../models/Activity.js";
import Submission from "../models/Submission.js";
import User from "../models/User.js";
import transcriptionService from "../services/transcriptionService.js";

const ActivityController = {
  async getActivityById(req, res) {
    try {
      const { activityId } = req.params;
      console.log(`[GetActivity] Request for ID: ${activityId}`);

      if (!activityId) {
        return res.status(400).json({ message: "Activity ID is required" });
      }

      // Use explicit findOne to ensure we are querying the correct column
      const activity = await Activity.findOne({
        where: { activity_id: activityId }
      });

      if (!activity) {
        console.log(`[GetActivity] Not found: ${activityId}`);
        return res.status(404).json({ message: "Activity not found" });
      }

      console.log(`[GetActivity] Found: ${activity.title}`);
      res.json(activity);
    } catch (error) {
      console.error("Get Activity Error:", error);
      res.status(500).json({ message: "Failed to fetch activity", error: error.message });
    }
  },

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
      const starter_code_url = req.body.starter_code_url;
      const quiz_url = req.body.quiz_url;

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
        starter_code_url: starter_code_url || null,
        quiz_url: quiz_url || null,
      });

      // Queue transcription if video was uploaded
      if (newActivity.video_url) {
        transcriptionService.queueTranscription(newActivity.activity_id, newActivity.video_url)
          .catch(err => console.error("Failed to queue transcription:", err.message));
      }

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

  async updateActivity(req, res) {
    try {
      const { activityId } = req.params;
      const { title, start_date, end_date, video_url, md_file_url, starter_code_url, quiz_url } = req.body;

      const activity = await Activity.findOne({
        where: { activity_id: activityId }
      });

      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }

      // Update only provided fields
      if (title !== undefined) activity.title = title;
      if (start_date !== undefined) activity.start_date = start_date;
      if (end_date !== undefined) activity.end_date = end_date;
      if (video_url !== undefined) activity.video_url = video_url;
      if (md_file_url !== undefined) activity.md_file_url = md_file_url;
      if (starter_code_url !== undefined) activity.starter_code_url = starter_code_url;
      if (quiz_url !== undefined) activity.quiz_url = quiz_url;

      await activity.save();

      res.json(activity);
    } catch (error) {
      console.error("Update Activity Error:", error);
      res.status(500).json({ message: "Failed to update activity", error: error.message });
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
  },

  async submitActivity(req, res) {
    try {
      const { activityId } = req.params;
      const { userId, firebaseId, score } = req.body;

      console.log(`[SubmitActivity] ActID: ${activityId}, User: ${userId || firebaseId}, Score: ${score}`);

      if (!activityId) return res.status(400).json({ message: "Activity ID is required" });
      if (!userId && !firebaseId) return res.status(400).json({ message: "User ID or Firebase ID is required" });

      // Find the user first
      let user;
      if (userId) {
        user = await User.findByPk(userId);
      } else if (firebaseId) {
        user = await User.findOne({ where: { firebaseId: firebaseId } });
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if submission exists
      let submission = await Submission.findOne({
        where: {
          activity_id: activityId,
          user_id: user.id
        }
      });

      if (submission) {
        // Update score if better? Or just update. Let's update.
        submission.score = score || submission.score;
        await submission.save();
        return res.json({ message: "Submission updated", submission });
      } else {
        // Create new
        submission = await Submission.create({
          activity_id: activityId,
          user_id: user.id,
          score: score || 100 // Default score if not provided
        });
        return res.status(201).json({ message: "Activity submitted successfully", submission });
      }

    } catch (error) {
      console.error("Submit Activity Error:", error);
      res.status(500).json({ message: "Failed to submit activity", error: error.message });
    }
  }
};

export default ActivityController;
