import { sequelize } from "../configs/postgresDB.js";
import Submission from "../models/Submission.js";
import ActivityTestCase from "../models/ActivityTestCase.js";
import SubmissionTestResult from "../models/SubmissionTestResult.js";
import QuizQuestion from "../models/QuizQuestion.js";
import Enrollment from "../models/Enrollment.js";
import { resolveCallerUserId } from "../utils/resolveCaller.js";
import { verifyAnswer } from "../utils/quizGrading.js";
import rewardPipeline from "../services/rewardPipeline.js";

// Build a Set of test_case_ids the user has already passed for this activity,
// excluding the submission we're about to create (which doesn't exist yet).
async function loadAlreadyPassedTestCaseIds({ userId, activityId, txn }) {
    const rows = await SubmissionTestResult.findAll({
        attributes: ["test_case_id"],
        where: { passed: true },
        include: [
            {
                model: Submission,
                as: "submission",
                attributes: [],
                where: { user_id: userId, activity_id: activityId },
                required: true,
            },
        ],
        transaction: txn,
    });
    return new Set(rows.map((r) => r.test_case_id));
}

const SubmissionController = {
    async create(req, res) {
        try {
            const courseId = parseInt(req.params.courseId, 10);
            const activityId = parseInt(req.params.activityId, 10);
            if (!Number.isInteger(courseId) || !Number.isInteger(activityId)) {
                return res.status(400).json({ error: "Invalid courseId or activityId" });
            }

            const {
                started_at: startedAt,
                active_seconds: activeSeconds = 0,
                hints_used: hintsUsed = 0,
                local_hour: localHour,
                code_test_outcomes: codeOutcomes = [],
                quiz_answers: quizAnswers = [],
            } = req.body || {};

            if (!startedAt) {
                return res.status(400).json({ error: "started_at is required" });
            }

            const userId = await resolveCallerUserId(req);
            if (!userId) return res.status(401).json({ error: "Caller not registered" });

            const enrolled = await Enrollment.count({
                where: { user_id: userId, course_id: courseId },
            });
            if (enrolled === 0) {
                return res.status(403).json({ error: "Not enrolled in this course" });
            }

            const result = await sequelize.transaction(async (txn) => {
                const testCases = await ActivityTestCase.findAll({
                    where: { activity_id: activityId },
                    transaction: txn,
                });

                const codeByRef = new Map(
                    codeOutcomes.map((o) => [String(o.external_ref), !!o.passed]),
                );

                const quizQuestions = await QuizQuestion.findAll({
                    where: { activity_id: activityId },
                    transaction: txn,
                });
                const quizById = new Map(quizQuestions.map((q) => [String(q.id), q]));
                const submittedAnswerById = new Map(
                    quizAnswers.map((a) => [String(a.question_id), a.answer]),
                );

                const alreadyPassed = await loadAlreadyPassedTestCaseIds({
                    userId, activityId, txn,
                });

                // Decide pass/fail and points_awarded per test case.
                const perCase = testCases.map((tc) => {
                    let passed = false;
                    if (tc.kind === "CODE") {
                        passed = codeByRef.get(String(tc.external_ref)) === true;
                    } else if (tc.kind === "QUIZ") {
                        const q = quizById.get(String(tc.external_ref));
                        const submitted = submittedAnswerById.get(String(tc.external_ref));
                        if (q && submitted !== undefined) {
                            passed = verifyAnswer(q.type, submitted, q.correct_answer);
                        }
                    }
                    const pointsAwarded = passed && !alreadyPassed.has(tc.test_case_id)
                        ? tc.points
                        : 0;
                    return { tc, passed, pointsAwarded };
                });

                const allPassed = perCase.length > 0 && perCase.every((r) => r.passed);
                const status = allPassed ? "PASSED" : "FAILED";
                const score = perCase.reduce((s, r) => s + r.pointsAwarded, 0);

                const priorAttempts = await Submission.count({
                    where: { user_id: userId, activity_id: activityId },
                    transaction: txn,
                });

                const submission = await Submission.create(
                    {
                        user_id: userId,
                        activity_id: activityId,
                        score,
                        started_at: new Date(startedAt),
                        status,
                        active_seconds: Math.max(0, parseInt(activeSeconds, 10) || 0),
                        hints_used: Math.max(0, parseInt(hintsUsed, 10) || 0),
                        attempt_number: priorAttempts + 1,
                    },
                    { transaction: txn },
                );

                const resultRows = await SubmissionTestResult.bulkCreate(
                    perCase.map((r) => ({
                        submission_id: submission.submission_id,
                        test_case_id: r.tc.test_case_id,
                        passed: r.passed,
                        points_awarded: r.pointsAwarded,
                    })),
                    { transaction: txn },
                );

                const rewards = await rewardPipeline.process({
                    submissionId: submission.submission_id,
                    localHour,
                    txn,
                });

                return {
                    submission: {
                        submission_id: submission.submission_id,
                        status: submission.status,
                        score: submission.score,
                        attempt_number: submission.attempt_number,
                    },
                    test_results: resultRows.map((r) => ({
                        test_case_id: r.test_case_id,
                        passed: r.passed,
                        points_awarded: r.points_awarded,
                    })),
                    rewards,
                };
            });

            return res.status(201).json(result);
        } catch (err) {
            const status = err.status || 500;
            if (status === 500) console.error("Submission.create error:", err);
            return res.status(status).json({ error: err.message || "Failed to create submission" });
        }
    },

    async listMine(req, res) {
        try {
            const activityId = parseInt(req.params.activityId, 10);
            if (!Number.isInteger(activityId)) {
                return res.status(400).json({ error: "Invalid activityId" });
            }
            const userId = await resolveCallerUserId(req);
            if (!userId) return res.status(401).json({ error: "Caller not registered" });

            const rows = await Submission.findAll({
                where: { user_id: userId, activity_id: activityId },
                include: [{ model: SubmissionTestResult, as: "testResults" }],
                order: [["created_at", "DESC"]],
            });

            return res.status(200).json({
                items: rows.map((s) => ({
                    submission_id: s.submission_id,
                    status: s.status,
                    score: s.score,
                    attempt_number: s.attempt_number,
                    active_seconds: s.active_seconds,
                    hints_used: s.hints_used,
                    started_at: s.started_at,
                    created_at: s.created_at,
                    test_results: (s.testResults || []).map((r) => ({
                        test_case_id: r.test_case_id,
                        passed: r.passed,
                        points_awarded: r.points_awarded,
                    })),
                })),
            });
        } catch (err) {
            console.error("Submission.listMine error:", err);
            return res.status(500).json({ error: "Failed to load submissions" });
        }
    },
};

export default SubmissionController;
