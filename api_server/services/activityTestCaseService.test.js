jest.mock("../models/ActivityTestCase.js", () => ({
    __esModule: true,
    default: {
        findAll: jest.fn(),
        create: jest.fn(),
        destroy: jest.fn(),
    },
}));
jest.mock("../models/QuizQuestion.js", () => ({
    __esModule: true,
    default: { findAll: jest.fn() },
}));

import ActivityTestCase from "../models/ActivityTestCase.js";
import QuizQuestion from "../models/QuizQuestion.js";
import {
    rebalancePoints,
    syncQuizTestCases,
    setCodeTestCases,
    distribute,
} from "./activityTestCaseService.js";

function row(kind, ref, points = 0) {
    return {
        test_case_id: Math.floor(Math.random() * 100000),
        kind,
        external_ref: ref,
        points,
        save: jest.fn().mockResolvedValue(undefined),
    };
}

describe("distribute", () => {
    it("returns 0 when count is 0", () => {
        expect(distribute(100, 0)).toBe(0);
    });
    it("floors when uneven", () => {
        expect(distribute(100, 3)).toBe(33);
    });
});

describe("rebalancePoints", () => {
    beforeEach(() => {
        ActivityTestCase.findAll.mockReset();
    });

    it("allocates 100 across code-only", async () => {
        const rows = [row("CODE", "a"), row("CODE", "b"), row("CODE", "c"), row("CODE", "d")];
        ActivityTestCase.findAll.mockResolvedValue(rows);
        await rebalancePoints(1);
        rows.forEach((r) => expect(r.points).toBe(25));
        rows.forEach((r) => expect(r.save).toHaveBeenCalled());
    });

    it("allocates 100 across quiz-only", async () => {
        const rows = [row("QUIZ", "1"), row("QUIZ", "2")];
        ActivityTestCase.findAll.mockResolvedValue(rows);
        await rebalancePoints(1);
        expect(rows.map((r) => r.points)).toEqual([50, 50]);
    });

    it("splits 70/30 across code + quiz", async () => {
        const rows = [
            row("CODE", "a"), row("CODE", "b"),
            row("QUIZ", "1"), row("QUIZ", "2"), row("QUIZ", "3"),
        ];
        ActivityTestCase.findAll.mockResolvedValue(rows);
        await rebalancePoints(1);
        expect(rows[0].points).toBe(35);
        expect(rows[1].points).toBe(35);
        expect(rows[2].points).toBe(10);
        expect(rows[3].points).toBe(10);
        expect(rows[4].points).toBe(10);
    });

    it("does not save rows whose points are already correct", async () => {
        const rows = [row("CODE", "a", 100)];
        ActivityTestCase.findAll.mockResolvedValue(rows);
        await rebalancePoints(1);
        expect(rows[0].save).not.toHaveBeenCalled();
    });
});

describe("syncQuizTestCases", () => {
    beforeEach(() => {
        ActivityTestCase.findAll.mockReset();
        ActivityTestCase.create.mockReset();
        ActivityTestCase.destroy.mockReset();
        QuizQuestion.findAll.mockReset();
    });

    it("inserts QUIZ rows for new questions, removes orphans, rebalances", async () => {
        QuizQuestion.findAll.mockResolvedValue([{ id: 10 }, { id: 11 }, { id: 12 }]);
        // existing: only "10" plus an orphan "99"
        const existing = [row("QUIZ", "10"), row("QUIZ", "99")];
        // 1st findAll for QUIZ rows, 2nd findAll inside rebalancePoints
        ActivityTestCase.findAll
            .mockResolvedValueOnce(existing)
            .mockResolvedValueOnce([row("QUIZ", "10"), row("QUIZ", "11"), row("QUIZ", "12")]);

        await syncQuizTestCases(1);

        expect(ActivityTestCase.destroy).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ activity_id: 1, kind: "QUIZ", external_ref: ["99"] }),
            })
        );
        const createdRefs = ActivityTestCase.create.mock.calls.map((c) => c[0].external_ref);
        expect(createdRefs).toEqual(["11", "12"]);
    });

    it("removes all QUIZ rows when no questions exist", async () => {
        QuizQuestion.findAll.mockResolvedValue([]);
        const existing = [row("QUIZ", "1"), row("QUIZ", "2")];
        ActivityTestCase.findAll
            .mockResolvedValueOnce(existing)
            .mockResolvedValueOnce([]);

        await syncQuizTestCases(1);

        expect(ActivityTestCase.destroy).toHaveBeenCalled();
        expect(ActivityTestCase.create).not.toHaveBeenCalled();
    });
});

describe("setCodeTestCases", () => {
    beforeEach(() => {
        ActivityTestCase.findAll.mockReset();
        ActivityTestCase.create.mockReset();
        ActivityTestCase.destroy.mockReset();
    });

    it("dedupes and trims names; only inserts missing ones", async () => {
        ActivityTestCase.findAll
            .mockResolvedValueOnce([row("CODE", "existing")])
            .mockResolvedValueOnce([row("CODE", "existing"), row("CODE", "new")]);

        await setCodeTestCases(1, ["existing", " new ", "new", ""]);

        const createdRefs = ActivityTestCase.create.mock.calls.map((c) => c[0].external_ref);
        expect(createdRefs).toEqual(["new"]);
        expect(ActivityTestCase.destroy).not.toHaveBeenCalled();
    });

    it("removes existing CODE rows that aren't in the new list", async () => {
        ActivityTestCase.findAll
            .mockResolvedValueOnce([row("CODE", "old1"), row("CODE", "old2"), row("CODE", "keep")])
            .mockResolvedValueOnce([row("CODE", "keep")]);

        await setCodeTestCases(1, ["keep"]);

        expect(ActivityTestCase.destroy).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    kind: "CODE",
                    external_ref: expect.arrayContaining(["old1", "old2"]),
                }),
            })
        );
    });
});
