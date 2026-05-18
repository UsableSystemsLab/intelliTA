import User from "../models/User.js";
import QuizQuestion from "../models/QuizQuestion.js";
import StudentAnswer from "../models/StudentAnswer.js";

function verifyAnswer(type, submitted, correct) {
    if (type === "fill_blank") {
        return String(submitted).trim().toLowerCase() === String(correct).trim().toLowerCase();
    }
    return submitted === correct;
}

const StudentAnswerController = {
    async recordAnswer(req, res) {
        try {
            const { activityId } = req.params;
            const { firebaseId, question_id, answer, is_correct: clientIsCorrect } = req.body;

            if (!firebaseId || question_id === undefined || answer === undefined) {
                return res.status(400).json({ message: "firebaseId, question_id, and answer are required" });
            }

            const user = await User.findOne({ where: { firebaseId } });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const question = await QuizQuestion.findByPk(question_id);
            if (!question) {
                return res.status(404).json({ message: "Question not found" });
            }


            const is_correct = question.type === "coding"
                ? !!clientIsCorrect
                : verifyAnswer(question.type, answer, question.correct_answer);

            await StudentAnswer.create({
                user_id: user.id,
                question_id,
                activity_id: activityId,
                answer,
                is_correct,
            });

            res.status(201).json({ is_correct });
        } catch (error) {
            console.error("Record Answer Error:", error);
            res.status(500).json({ message: "Failed to record answer", error: error.message });
        }
    },

    async getAnswers(req, res) {
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

            const answers = await StudentAnswer.findAll({
                where: { user_id: user.id, activity_id: activityId },
                order: [["answered_at", "ASC"]],
            });

            res.json({ answers });
        } catch (error) {
            console.error("Get Answers Error:", error);
            res.status(500).json({ message: "Failed to fetch answers", error: error.message });
        }
    },
};

export default StudentAnswerController;
