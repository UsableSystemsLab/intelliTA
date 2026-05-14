import { verifyAnswer } from "./quizGrading.js";

describe("verifyAnswer", () => {
    test("fill_blank: case-insensitive, trims whitespace", () => {
        expect(verifyAnswer("fill_blank", "  Hello ", "hello")).toBe(true);
        expect(verifyAnswer("fill_blank", "world", "World")).toBe(true);
        expect(verifyAnswer("fill_blank", "foo", "bar")).toBe(false);
    });

    test("mcq: strict equality", () => {
        expect(verifyAnswer("mcq", "A", "A")).toBe(true);
        expect(verifyAnswer("mcq", "a", "A")).toBe(false);
    });

    test("true_false: strict equality", () => {
        expect(verifyAnswer("true_false", true, true)).toBe(true);
        expect(verifyAnswer("true_false", false, true)).toBe(false);
    });
});
