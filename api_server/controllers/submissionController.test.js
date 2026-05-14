jest.mock("../configs/postgresDB.js", () => ({
    __esModule: true,
    sequelize: {
        transaction: jest.fn((fn) => fn({})),
    },
}));
jest.mock("../models/Submission.js", () => ({
    __esModule: true,
    default: {
        count: jest.fn(),
        create: jest.fn(),
        findAll: jest.fn(),
    },
}));
jest.mock("../models/ActivityTestCase.js", () => ({
    __esModule: true,
    default: { findAll: jest.fn() },
}));
jest.mock("../models/SubmissionTestResult.js", () => ({
    __esModule: true,
    default: { findAll: jest.fn(), bulkCreate: jest.fn() },
}));
jest.mock("../models/QuizQuestion.js", () => ({
    __esModule: true,
    default: { findAll: jest.fn() },
}));
jest.mock("../models/Enrollment.js", () => ({
    __esModule: true,
    default: { count: jest.fn() },
}));
jest.mock("../utils/resolveCaller.js", () => ({
    __esModule: true,
    resolveCallerUserId: jest.fn(),
}));
jest.mock("../services/rewardPipeline.js", () => ({
    __esModule: true,
    default: { process: jest.fn() },
}));

import { mockReq, mockRes } from "../__tests__/helpers/mockReqRes.js";
import Submission from "../models/Submission.js";
import ActivityTestCase from "../models/ActivityTestCase.js";
import SubmissionTestResult from "../models/SubmissionTestResult.js";
import QuizQuestion from "../models/QuizQuestion.js";
import Enrollment from "../models/Enrollment.js";
import { resolveCallerUserId } from "../utils/resolveCaller.js";
import rewardPipeline from "../services/rewardPipeline.js";
import SubmissionController from "./submissionController.js";

const baseReq = (over = {}) => mockReq({
    params: { courseId: "10", activityId: "42" },
    body: {
        started_at: "2026-05-14T00:00:00Z",
        active_seconds: 600,
        hints_used: 0,
        local_hour: 14,
        code_test_outcomes: [],
        quiz_answers: [],
    },
    firebaseUser: { uid: "u" },
    ...over,
});

beforeEach(() => {
    resolveCallerUserId.mockResolvedValue(7);
    Enrollment.count.mockResolvedValue(1);
    Submission.count.mockResolvedValue(0);
    SubmissionTestResult.findAll.mockResolvedValue([]);
    QuizQuestion.findAll.mockResolvedValue([]);
    rewardPipeline.process.mockResolvedValue({
        points_earned: 0,
        lines: [],
        badges_awarded: [],
        notifications: [],
    });
});

describe("SubmissionController.create", () => {
    test("happy path: all CODE tests pass → PASSED, attempt_number 1", async () => {
        ActivityTestCase.findAll.mockResolvedValue([
            { test_case_id: 51, kind: "CODE", external_ref: "test_add", points: 50 },
            { test_case_id: 52, kind: "CODE", external_ref: "test_sub", points: 50 },
        ]);
        Submission.create.mockResolvedValue({
            submission_id: 1234,
            status: "PASSED",
            score: 100,
            attempt_number: 1,
        });
        SubmissionTestResult.bulkCreate.mockResolvedValue([
            { test_case_id: 51, passed: true, points_awarded: 50 },
            { test_case_id: 52, passed: true, points_awarded: 50 },
        ]);

        const req = baseReq({
            body: {
                ...baseReq().body,
                code_test_outcomes: [
                    { external_ref: "test_add", passed: true },
                    { external_ref: "test_sub", passed: true },
                ],
            },
        });
        const res = mockRes();
        await SubmissionController.create(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        const body = res.json.mock.calls[0][0];
        expect(body.submission.status).toBe("PASSED");
        expect(body.submission.attempt_number).toBe(1);
        expect(body.test_results).toHaveLength(2);
        expect(rewardPipeline.process).toHaveBeenCalledWith(expect.objectContaining({
            submissionId: 1234,
            localHour: 14,
        }));
    });

    test("FAILED when any test case fails", async () => {
        ActivityTestCase.findAll.mockResolvedValue([
            { test_case_id: 51, kind: "CODE", external_ref: "test_add", points: 50 },
            { test_case_id: 52, kind: "CODE", external_ref: "test_sub", points: 50 },
        ]);
        Submission.create.mockResolvedValue({
            submission_id: 1,
            status: "FAILED",
            score: 50,
            attempt_number: 1,
        });
        SubmissionTestResult.bulkCreate.mockResolvedValue([
            { test_case_id: 51, passed: true, points_awarded: 50 },
            { test_case_id: 52, passed: false, points_awarded: 0 },
        ]);
        const req = baseReq({
            body: {
                ...baseReq().body,
                code_test_outcomes: [
                    { external_ref: "test_add", passed: true },
                    { external_ref: "test_sub", passed: false },
                ],
            },
        });
        const res = mockRes();
        await SubmissionController.create(req, res);
        const createArgs = Submission.create.mock.calls[0][0];
        expect(createArgs.status).toBe("FAILED");
        expect(createArgs.score).toBe(50);
    });

    test("points_awarded is 0 on a re-pass of an already-passed test case", async () => {
        ActivityTestCase.findAll.mockResolvedValue([
            { test_case_id: 51, kind: "CODE", external_ref: "test_add", points: 50 },
        ]);
        SubmissionTestResult.findAll.mockResolvedValue([{ test_case_id: 51 }]);
        Submission.create.mockResolvedValue({
            submission_id: 2, status: "PASSED", score: 0, attempt_number: 2,
        });
        SubmissionTestResult.bulkCreate.mockResolvedValue([
            { test_case_id: 51, passed: true, points_awarded: 0 },
        ]);
        const req = baseReq({
            body: {
                ...baseReq().body,
                code_test_outcomes: [{ external_ref: "test_add", passed: true }],
            },
        });
        const res = mockRes();
        await SubmissionController.create(req, res);
        const createArgs = Submission.create.mock.calls[0][0];
        expect(createArgs.score).toBe(0);
        const bulkArgs = SubmissionTestResult.bulkCreate.mock.calls[0][0];
        expect(bulkArgs[0].points_awarded).toBe(0);
    });

    test("QUIZ test cases graded via verifyAnswer", async () => {
        ActivityTestCase.findAll.mockResolvedValue([
            { test_case_id: 60, kind: "QUIZ", external_ref: "9", points: 30 },
        ]);
        QuizQuestion.findAll.mockResolvedValue([
            { id: 9, type: "mcq", correct_answer: "B" },
        ]);
        Submission.create.mockResolvedValue({
            submission_id: 3, status: "PASSED", score: 30, attempt_number: 1,
        });
        SubmissionTestResult.bulkCreate.mockResolvedValue([
            { test_case_id: 60, passed: true, points_awarded: 30 },
        ]);
        const req = baseReq({
            body: {
                ...baseReq().body,
                quiz_answers: [{ question_id: 9, answer: "B" }],
            },
        });
        const res = mockRes();
        await SubmissionController.create(req, res);
        const bulkArgs = SubmissionTestResult.bulkCreate.mock.calls[0][0];
        expect(bulkArgs[0].passed).toBe(true);
    });

    test("attempt_number increments by 1 per prior submission", async () => {
        Submission.count.mockResolvedValue(3);
        ActivityTestCase.findAll.mockResolvedValue([
            { test_case_id: 51, kind: "CODE", external_ref: "t", points: 100 },
        ]);
        Submission.create.mockResolvedValue({
            submission_id: 5, status: "PASSED", score: 100, attempt_number: 4,
        });
        SubmissionTestResult.bulkCreate.mockResolvedValue([
            { test_case_id: 51, passed: true, points_awarded: 100 },
        ]);
        const req = baseReq({
            body: {
                ...baseReq().body,
                code_test_outcomes: [{ external_ref: "t", passed: true }],
            },
        });
        await SubmissionController.create(req, mockRes());
        expect(Submission.create.mock.calls[0][0].attempt_number).toBe(4);
    });

    test("403 when caller is not enrolled in the course", async () => {
        Enrollment.count.mockResolvedValue(0);
        const req = baseReq();
        const res = mockRes();
        await SubmissionController.create(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test("400 when started_at is missing", async () => {
        const req = baseReq({ body: { ...baseReq().body, started_at: undefined } });
        const res = mockRes();
        await SubmissionController.create(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

describe("SubmissionController.listMine", () => {
    test("returns caller's submissions with test_results", async () => {
        Submission.findAll.mockResolvedValue([
            {
                submission_id: 1,
                status: "PASSED",
                score: 100,
                attempt_number: 1,
                active_seconds: 600,
                hints_used: 0,
                started_at: new Date(),
                created_at: new Date(),
                testResults: [{ test_case_id: 51, passed: true, points_awarded: 50 }],
            },
        ]);
        const req = baseReq();
        const res = mockRes();
        await SubmissionController.listMine(req, res);
        const body = res.json.mock.calls[0][0];
        expect(body.items).toHaveLength(1);
        expect(body.items[0].test_results).toHaveLength(1);
    });

    test("401 when caller is not registered", async () => {
        resolveCallerUserId.mockResolvedValue(null);
        const req = baseReq();
        const res = mockRes();
        await SubmissionController.listMine(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
    });
});
