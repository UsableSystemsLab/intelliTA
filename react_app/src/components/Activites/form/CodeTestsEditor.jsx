import { FlaskConical, Plus, X, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

// Declares the CODE test names that drive gamification scoring.
// There is no GET for code-tests, so this is write-only: leaving it
// empty skips the PUT entirely (existing config is preserved).
export default function CodeTestsEditor({ testNames, onTestNamesChange, hasQuiz }) {
  const { t } = useTranslation();
  const names = testNames || [];

  const update = (i, value) =>
    onTestNamesChange(names.map((n, idx) => (idx === i ? value : n)));
  const add = () => onTestNamesChange([...names, ""]);
  const remove = (i) => onTestNamesChange(names.filter((_, idx) => idx !== i));

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
        <FlaskConical className="w-4 h-4 text-blue-400" />
        {t("codeTests.label", { defaultValue: "Code Test Names (gamification)" })}
        <span className="text-gray-500 font-normal">{t("optional")}</span>
      </label>

      <div className="flex items-start gap-2 px-3 py-2 mb-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400 leading-relaxed">
          {hasQuiz
            ? t("codeTests.hintSplit", {
                defaultValue:
                  "Points rebalance automatically: 70 spread across these code tests, 30 across the quiz.",
              })
            : t("codeTests.hintFull", {
                defaultValue:
                  "Points rebalance automatically: 100 spread evenly across these code tests.",
              })}{" "}
          {t("codeTests.hintEmpty", {
            defaultValue: "Leave empty to keep the existing test configuration.",
          })}
        </p>
      </div>

      <div className="space-y-2">
        {names.map((name, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => update(i, e.target.value)}
              placeholder={t("codeTests.placeholder", {
                defaultValue: "e.g., test_handles_empty_input",
              })}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm
                         placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              title={t("codeTests.remove", { defaultValue: "Remove" })}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-400
                   hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        {t("codeTests.add", { defaultValue: "Add test" })}
      </button>
    </div>
  );
}
