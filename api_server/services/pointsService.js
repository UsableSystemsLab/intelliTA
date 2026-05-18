const NO_HINT_BONUS = 25;
const HINT_PENALTY_PER_HINT = -5;
function calculatePoints({ submission, testResults, priorPassedTestCaseIds }) {
    const lines = [];

    // BASE — sum of points_awarded for newly-passed test cases.
    // Activities with no test cases auto-pass and award submission.score once.
    const prior = priorPassedTestCaseIds || new Set();
    let base = 0;
    const results = testResults || [];
    if (results.length === 0 && submission?.status === "PASSED") {
        const priorAttempts = submission?.attempt_number ?? 1;
        if (priorAttempts === 1) {
            base = submission?.score || 0;
        }
    } else {
        for (const r of results) {
            if (r.passed && !prior.has(r.test_case_id)) {
                base += r.points_awarded || 0;
            }
        }
    }

    if (base <= 0) {
        return { lines: [], total: 0 };
    }

    lines.push({ event_type: "BASE", points: base });

    // Bonus / penalty only apply when the student fully solved the activity.
    // Partial completions earn raw BASE — no NO_HINT_BONUS shortcut.
    if (submission?.status === "PASSED") {
        const hints = submission?.hints_used || 0;
        if (hints === 0) {
            lines.push({ event_type: "NO_HINT_BONUS", points: NO_HINT_BONUS });
        } else {
            lines.push({
                event_type: "HINT_PENALTY",
                points: HINT_PENALTY_PER_HINT * hints,
            });
        }
    }

    const rawTotal = lines.reduce((sum, l) => sum + l.points, 0);
    const total = Math.max(0, rawTotal);

    return { lines, total };
}

export {
    calculatePoints,
    NO_HINT_BONUS,
    HINT_PENALTY_PER_HINT,
};
