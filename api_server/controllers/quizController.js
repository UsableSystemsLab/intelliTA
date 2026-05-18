import Activity from "../models/Activity.js";
import QuizQuestion from "../models/QuizQuestion.js";
import { sequelize } from "../configs/postgresDB.js";
import { syncQuizTestCases } from "../services/activityTestCaseService.js";


 // (same shape as the old S3 quiz JSON)

function toQuizJson(rows) {
    return rows.map(q => {
        if (q.type === "coding") {
            return {
                id: q.id,
                time: q.time_seconds,
                type: "coding",
                title: q.title,
                instruction: q.instruction,
                fileName: q.file_name,
                check: q.check_regex,
                test_name: q.test_name,
                test_class: q.test_class,
            };
        }
        const base = {
            id: q.id,
            time: q.time_seconds,
            type: q.type,
            question: q.question,
            correctAnswer: q.correct_answer, // JSONB → correct JS type (int/bool/string)
        };
        if (q.type === "mcq") base.options = q.options;
        return base;
    });
}

const QuizController = {
    async getQuiz(req, res) {
        try {
            const { activityId } = req.params;

            const rows = await QuizQuestion.findAll({
                where: { activity_id: activityId },
                order: [["time_seconds", "ASC"]],
            });

            res.json({ quizzes: toQuizJson(rows) });
        } catch (error) {
            console.error("Get Quiz Error:", error);
            res.status(500).json({ message: "Failed to fetch quiz questions", error: error.message });
        }
    },

    async setQuiz(req, res) {
        try {
            const { activityId } = req.params;
            const { quizzes } = req.body;

            if (!Array.isArray(quizzes)) {
                return res.status(400).json({ message: "quizzes must be an array" });
            }

            const activity = await Activity.findOne({ where: { activity_id: activityId } });
            if (!activity) {
                return res.status(404).json({ message: "Activity not found" });
            }

            const created = await sequelize.transaction(async (txn) => {
                // Atomically replace all questions for this activity
                await QuizQuestion.destroy({ where: { activity_id: activityId }, transaction: txn });

                if (quizzes.length === 0) {
                    await syncQuizTestCases(activityId, { txn });
                    return [];
                }

                const rows = quizzes.map(q => ({
                    activity_id: activityId,
                    time_seconds: q.time,
                    type: q.type,
                    question: q.question || null,
                    title: q.title || null,
                    instruction: q.instruction || null,
                    file_name: q.fileName || null,
                    check_regex: q.check || null,
                    test_name: q.test_name || null,
                    test_class: q.test_class || null,
                    options: q.options || null,
                    correct_answer: q.correctAnswer !== undefined ? q.correctAnswer : null,
                }));

                const inserted = await QuizQuestion.bulkCreate(rows, { returning: true, transaction: txn });
                await syncQuizTestCases(activityId, { txn });
                return inserted;
            });

            res.status(201).json({ quizzes: toQuizJson(created) });
        } catch (error) {
            console.error("Set Quiz Error:", error);
            res.status(500).json({ message: "Failed to save quiz questions", error: error.message });
        }
    },
};

export default QuizController;
