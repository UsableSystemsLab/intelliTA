// Shared helper: compare a student answer against the stored correct answer.
// Lives in utils/ so both studentAnswerController and submissionController
// can use the same grading rule.
export function verifyAnswer(type, submitted, correct) {
    if (type === "fill_blank") {
        return String(submitted).trim().toLowerCase() === String(correct).trim().toLowerCase();
    }
    return submitted === correct;
}

export default { verifyAnswer };
