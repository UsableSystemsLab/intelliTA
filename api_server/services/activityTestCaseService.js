// Maintains activity_test_cases rows for an activity:
//   - syncQuizTestCases keeps QUIZ rows aligned with the activity's quiz_questions
//   - setCodeTestCases lets an instructor declare the CODE test names
//   - rebalancePoints distributes the 100-point budget evenly across every
//     test case regardless of kind (5 cases -> 20 each)
import ActivityTestCase from "../models/ActivityTestCase.js";
import QuizQuestion from "../models/QuizQuestion.js";

function distribute(budget, count) {
    if (!count) return 0;
    return Math.floor(budget / count);
}

async function rebalancePoints(activityId, { txn } = {}) {
    const rows = await ActivityTestCase.findAll({
        where: { activity_id: activityId },
        transaction: txn,
    });

    const perCase = distribute(100, rows.length);

    for (const r of rows) {
        if (r.points !== perCase) {
            r.points = perCase;
            await r.save({ transaction: txn });
        }
    }
}

async function syncQuizTestCases(activityId, { txn } = {}) {
    const questions = await QuizQuestion.findAll({
        where: { activity_id: activityId },
        attributes: ["id"],
        transaction: txn,
    });
    const wantedRefs = questions.map((q) => String(q.id));
    const wantedSet = new Set(wantedRefs);

    const existing = await ActivityTestCase.findAll({
        where: { activity_id: activityId, kind: "QUIZ" },
        transaction: txn,
    });
    const existingRefs = new Set(existing.map((r) => r.external_ref));

    const orphans = existing.filter((r) => !wantedSet.has(r.external_ref));
    if (orphans.length) {
        await ActivityTestCase.destroy({
            where: {
                activity_id: activityId,
                kind: "QUIZ",
                external_ref: orphans.map((r) => r.external_ref),
            },
            transaction: txn,
        });
    }

    let position = existing.length;
    for (const ref of wantedRefs) {
        if (existingRefs.has(ref)) continue;
        await ActivityTestCase.create(
            {
                activity_id: activityId,
                kind: "QUIZ",
                external_ref: ref,
                points: 0,
                position: position++,
            },
            { transaction: txn }
        );
    }

    await rebalancePoints(activityId, { txn });
}

async function setCodeTestCases(activityId, names, { txn } = {}) {
    const cleaned = [...new Set((names || []).map((n) => String(n).trim()).filter(Boolean))];
    const wantedSet = new Set(cleaned);

    const existing = await ActivityTestCase.findAll({
        where: { activity_id: activityId, kind: "CODE" },
        transaction: txn,
    });
    const existingRefs = new Set(existing.map((r) => r.external_ref));

    const orphans = existing.filter((r) => !wantedSet.has(r.external_ref));
    if (orphans.length) {
        await ActivityTestCase.destroy({
            where: {
                activity_id: activityId,
                kind: "CODE",
                external_ref: orphans.map((r) => r.external_ref),
            },
            transaction: txn,
        });
    }

    let position = existing.length;
    for (const ref of cleaned) {
        if (existingRefs.has(ref)) continue;
        await ActivityTestCase.create(
            {
                activity_id: activityId,
                kind: "CODE",
                external_ref: ref,
                points: 0,
                position: position++,
            },
            { transaction: txn }
        );
    }

    await rebalancePoints(activityId, { txn });
}

export {
    rebalancePoints,
    syncQuizTestCases,
    setCodeTestCases,
    distribute,
};
export default { rebalancePoints, syncQuizTestCases, setCodeTestCases };
