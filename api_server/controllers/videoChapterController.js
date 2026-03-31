import Activity from "../models/Activity.js";
import VideoChapter from "../models/VideoChapter.js";

function toChapterJson(rows) {
    return rows.map(c => ({
        id: c.id,
        title: c.title,
        start_time_seconds: c.start_time_seconds,
    }));
}

const VideoChapterController = {
    async getChapters(req, res) {
        try {
            const { activityId } = req.params;

            const rows = await VideoChapter.findAll({
                where: { activity_id: activityId },
                order: [["start_time_seconds", "ASC"]],
            });

            res.json({ chapters: toChapterJson(rows) });
        } catch (error) {
            console.error("Get Chapters Error:", error);
            res.status(500).json({ message: "Failed to fetch video chapters", error: error.message });
        }
    },

    async setChapters(req, res) {
        try {
            const { activityId } = req.params;
            const { chapters } = req.body;

            if (!Array.isArray(chapters)) {
                return res.status(400).json({ message: "chapters must be an array" });
            }

            const activity = await Activity.findOne({ where: { activity_id: activityId } });
            if (!activity) {
                return res.status(404).json({ message: "Activity not found" });
            }

            // Atomically replace all chapters for this activity
            await VideoChapter.destroy({ where: { activity_id: activityId } });

            if (chapters.length === 0) {
                return res.json({ chapters: [] });
            }

            const rows = chapters.map(c => ({
                activity_id: activityId,
                title: c.title,
                start_time_seconds: c.start_time_seconds,
            }));

            const created = await VideoChapter.bulkCreate(rows, { returning: true });
            res.status(201).json({ chapters: toChapterJson(created) });
        } catch (error) {
            console.error("Set Chapters Error:", error);
            res.status(500).json({ message: "Failed to save video chapters", error: error.message });
        }
    },

    async deleteChapter(req, res) {
        try {
            const { chapterId } = req.params;

            const chapter = await VideoChapter.findByPk(chapterId);
            if (!chapter) {
                return res.status(404).json({ message: "Chapter not found" });
            }

            await chapter.destroy();
            res.status(204).send();
        } catch (error) {
            console.error("Delete Chapter Error:", error);
            res.status(500).json({ message: "Failed to delete chapter", error: error.message });
        }
    },
};

export default VideoChapterController;
