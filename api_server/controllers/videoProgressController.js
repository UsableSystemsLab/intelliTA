import User from "../models/User.js";
import VideoProgress from "../models/VideoProgress.js";

const VideoProgressController = {
    async getProgress(req, res) {
        try {
            const { activityId } = req.params;
            const { firebaseId } = req.query;

            if (!firebaseId) {
                return res.status(400).json({ message: "firebaseId is required" });
            }

            const user = await User.findOne({ where: { firebaseId } });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const progress = await VideoProgress.findOne({
                where: { user_id: user.id, activity_id: activityId },
            });

            res.json({ last_watched_seconds: progress?.last_watched_seconds ?? 0 });
        } catch (error) {
            console.error("Get Progress Error:", error);
            res.status(500).json({ message: "Failed to fetch video progress", error: error.message });
        }
    },

    async upsertProgress(req, res) {
        try {
            const { activityId } = req.params;
            const { firebaseId, last_watched_seconds } = req.body;

            if (!firebaseId) {
                return res.status(400).json({ message: "firebaseId is required" });
            }
            if (last_watched_seconds === undefined || last_watched_seconds === null) {
                return res.status(400).json({ message: "last_watched_seconds is required" });
            }

            const user = await User.findOne({ where: { firebaseId } });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const [record, created] = await VideoProgress.findOrCreate({
                where: { user_id: user.id, activity_id: activityId },
                defaults: { last_watched_seconds },
            });

            if (!created) {
                await record.update({ last_watched_seconds, updated_at: new Date() });
            }

            res.json({ last_watched_seconds });
        } catch (error) {
            console.error("Upsert Progress Error:", error);
            res.status(500).json({ message: "Failed to save video progress", error: error.message });
        }
    },
};

export default VideoProgressController;
