import { calculatePoints, NO_HINT_BONUS, HINT_PENALTY_PER_HINT } from "./pointsService.js";

const makeResult = (id, passed, pts) => ({
    test_case_id: id,
    passed,
    points_awarded: pts,
});

describe("calculatePoints", () => {
    test("no passed test cases → zero, no lines", () => {
        const out = calculatePoints({
            submission: { status: "FAILED", hints_used: 0 },
            testResults: [makeResult(1, false, 50), makeResult(2, false, 50)],
            priorPassedTestCaseIds: new Set(),
        });
        expect(out).toEqual({ lines: [], total: 0 });
    });

    test("BASE only — no hints, no priors", () => {
        const out = calculatePoints({
            submission: { status: "PASSED", hints_used: 0 },
            testResults: [makeResult(1, true, 30), makeResult(2, true, 40)],
            priorPassedTestCaseIds: new Set(),
        });
        expect(out.lines).toEqual([
            { event_type: "BASE", points: 70 },
            { event_type: "NO_HINT_BONUS", points: NO_HINT_BONUS },
        ]);
        expect(out.total).toBe(70 + NO_HINT_BONUS);
    });

    test("hint penalty replaces no-hint bonus", () => {
        const out = calculatePoints({
            submission: { status: "PASSED", hints_used: 3 },
            testResults: [makeResult(1, true, 50)],
            priorPassedTestCaseIds: new Set(),
        });
        expect(out.lines).toEqual([
            { event_type: "BASE", points: 50 },
            { event_type: "HINT_PENALTY", points: HINT_PENALTY_PER_HINT * 3 },
        ]);
        expect(out.total).toBe(50 + HINT_PENALTY_PER_HINT * 3);
    });

    test("prior-passed test cases are excluded from BASE", () => {
        const out = calculatePoints({
            submission: { status: "PASSED", hints_used: 0 },
            testResults: [makeResult(1, true, 30), makeResult(2, true, 40)],
            priorPassedTestCaseIds: new Set([1]),
        });
        expect(out.lines[0]).toEqual({ event_type: "BASE", points: 40 });
    });

    test("all test cases previously passed → BASE 0, zero total, no lines", () => {
        const out = calculatePoints({
            submission: { status: "PASSED", hints_used: 0 },
            testResults: [makeResult(1, true, 30), makeResult(2, true, 40)],
            priorPassedTestCaseIds: new Set([1, 2]),
        });
        expect(out).toEqual({ lines: [], total: 0 });
    });

    test("hint penalty cannot drive total below 0", () => {
        const out = calculatePoints({
            submission: { status: "PASSED", hints_used: 100 },
            testResults: [makeResult(1, true, 10)],
            priorPassedTestCaseIds: new Set(),
        });
        // BASE 10 + penalty -500 → raw -490, floored to 0
        expect(out.total).toBe(0);
        expect(out.lines).toEqual([
            { event_type: "BASE", points: 10 },
            { event_type: "HINT_PENALTY", points: HINT_PENALTY_PER_HINT * 100 },
        ]);
    });

    test("activity with no test cases awards score as BASE on first attempt", () => {
        const out = calculatePoints({
            submission: { status: "PASSED", hints_used: 0, score: 100, attempt_number: 1 },
            testResults: [],
            priorPassedTestCaseIds: new Set(),
        });
        expect(out.lines).toEqual([
            { event_type: "BASE", points: 100 },
            { event_type: "NO_HINT_BONUS", points: NO_HINT_BONUS },
        ]);
        expect(out.total).toBe(100 + NO_HINT_BONUS);
    });

    test("activity with no test cases does not re-award on later attempts", () => {
        const out = calculatePoints({
            submission: { status: "PASSED", hints_used: 0, score: 100, attempt_number: 2 },
            testResults: [],
            priorPassedTestCaseIds: new Set(),
        });
        expect(out).toEqual({ lines: [], total: 0 });
    });

    test("missing inputs default safely", () => {
        const out = calculatePoints({
            submission: undefined,
            testResults: undefined,
            priorPassedTestCaseIds: undefined,
        });
        expect(out).toEqual({ lines: [], total: 0 });
    });
});
