import { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  HelpCircle,
  X,
  Plus,
  Trash2,
  ChevronDown,
  GripVertical,
  ToggleLeft,
  PenLine,
  Code2,
  Clock,
  Eye,
  Edit3,
  AlertTriangle,
} from "lucide-react";

const markdownComponents = {
  h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-semibold text-white mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold text-white mb-1">{children}</h3>,
  p: ({ children }) => <p className="text-gray-300 mb-2 leading-relaxed text-sm">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-2 space-y-0.5 text-sm">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-2 space-y-0.5 text-sm">{children}</ol>,
  li: ({ children }) => <li className="text-gray-300">{children}</li>,
  strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) return <code className="text-blue-300 text-xs font-mono">{children}</code>;
    return <code className="bg-gray-800 px-1 py-0.5 rounded text-blue-400 text-xs font-mono">{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="bg-gray-800 p-3 rounded-lg overflow-x-auto mb-2 border border-gray-700 text-xs">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-500 pl-3 italic text-gray-400 mb-2 bg-gray-800/50 py-1 rounded-r text-sm">{children}</blockquote>
  ),
  hr: () => <hr className="border-gray-700 my-3" />,
};

function MarkdownQuestionField({ value, onChange, placeholder }) {
  const [preview, setPreview] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-400">Question</label>
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {preview ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {preview ? "Edit" : "Preview"}
        </button>
      </div>
      {preview ? (
        <div className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg min-h-[4rem]">
          {value ? (
            <ReactMarkdown components={markdownComponents}>{value}</ReactMarkdown>
          ) : (
            <p className="text-gray-500 text-sm italic">Nothing to preview</p>
          )}
        </div>
      ) : (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500 resize-none font-mono"
        />
      )}
      {!preview && (
        <p className="text-[10px] text-gray-600 mt-0.5">Markdown is supported: **bold**, *italic*, `code`, lists, etc.</p>
      )}
    </div>
  );
}

const QUIZ_TYPES = [
  { value: "mcq", label: "Multiple Choice", icon: HelpCircle },
  { value: "true_false", label: "True / False", icon: ToggleLeft },
  { value: "fill_blank", label: "Fill in the Blank", icon: PenLine },
  { value: "coding", label: "Coding Challenge", icon: Code2 },
];

const TYPE_COLORS = {
  mcq: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  true_false: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  fill_blank: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  coding: "text-purple-400 bg-purple-500/10 border-purple-500/30",
};

function createEmptyQuestion(id) {
  return {
    id,
    time: 0,
    type: "mcq",
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    // coding-specific fields
    title: "",
    instruction: "",
    fileName: "",
    hint: "",
    check: "",
  };
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseTimeInput(value) {
  // Accept MM:SS or raw seconds
  if (value.includes(":")) {
    const [m, s] = value.split(":").map(Number);
    return (m || 0) * 60 + (s || 0);
  }
  return parseInt(value, 10) || 0;
}

// --- Single question editor card ---
// Select question type and put the question 

function QuestionCard({ question, index, onChange, onDelete, totalQuestions, fileNames, videoDuration }) {
  const [expanded, setExpanded] = useState(true);
  const typeConfig = QUIZ_TYPES.find((t) => t.value === question.type);
  const TypeIcon = typeConfig?.icon || HelpCircle;

  const update = (field, value) => {
    onChange({ ...question, [field]: value });
  };

  const updateOption = (optIdx, value) => {
    const newOptions = [...question.options];
    newOptions[optIdx] = value;
    update("options", newOptions);
  };

  const addOption = () => {
    update("options", [...question.options, ""]);
  };

  const removeOption = (optIdx) => {
    if (question.options.length <= 2) return;
    const newOptions = question.options.filter((_, i) => i !== optIdx);
    // Adjust correctAnswer if needed
    let newCorrect = question.correctAnswer;
    if (optIdx === newCorrect) newCorrect = 0;
    else if (optIdx < newCorrect) newCorrect--;
    onChange({ ...question, options: newOptions, correctAnswer: newCorrect });
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl overflow-hidden">
      {/* Card header — click to collapse */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors"
      >
        <GripVertical className="w-4 h-4 text-gray-600 shrink-0" />
        <div className={`p-1.5 rounded-lg border ${TYPE_COLORS[question.type]}`}>
          <TypeIcon className="w-4 h-4" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <span className="text-sm text-white font-medium truncate block">
            {question.question || question.title || `Question ${index + 1}`}
          </span>
          <span className="text-xs text-gray-500">
            {typeConfig?.label} &middot; {formatTime(question.time)}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-700/50 pt-4">
          {/* Row: Type + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Type</label>
              <select
                value={question.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  const updated = { ...question, type: newType };
                  // Reset correctAnswer shape and options on type change
                  if (newType === "true_false") {
                    updated.correctAnswer = true;
                  } else if (newType === "mcq") {
                    updated.correctAnswer = 0;
                    if (!updated.options || !Array.isArray(updated.options)) {
                      updated.options = ["", "", "", ""];
                    }
                  } else if (newType === "fill_blank") {
                    updated.correctAnswer = "";
                  }
                  onChange(updated);
                }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                {QUIZ_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">
                Time (MM:SS)
                {videoDuration > 0 && (
                  <span className="text-gray-600 font-normal ml-1">max {formatTime(videoDuration)}</span>
                )}
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={formatTime(question.time)}
                  onChange={(e) => {
                    let parsed = parseTimeInput(e.target.value);
                    if (videoDuration > 0 && parsed > videoDuration) {
                      parsed = videoDuration;
                    }
                    update("time", parsed);
                  }}
                  placeholder="00:00"
                  className={`w-full pl-9 pr-3 py-2 bg-gray-800 border rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 ${
                    videoDuration > 0 && question.time > videoDuration
                      ? "border-red-500"
                      : "border-gray-600"
                  }`}
                />
              </div>
              {videoDuration > 0 && question.time > videoDuration && (
                <p className="flex items-center gap-1 text-[10px] text-red-400 mt-0.5">
                  <AlertTriangle className="w-3 h-3" />
                  Exceeds video duration ({formatTime(videoDuration)})
                </p>
              )}
            </div>
          </div>

          {/* Type-specific fields */}
          {question.type === "coding" ? (
            <CodingFields question={question} onChange={onChange} fileNames={fileNames} />
          ) : (
            <QuizFields
              question={question}
              onChange={onChange}
              update={update}
              updateOption={updateOption}
              addOption={addOption}
              removeOption={removeOption}
            />
          )}

          {/* Delete button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onDelete}
              disabled={totalQuestions <= 1}
              className="flex items-center gap-1.5 px-3 py-1.5 text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Fields for mcq, true_false, fill_blank
function QuizFields({ question, onChange, update, updateOption, addOption, removeOption }) {
  return (
    <>
      {/* Question text with markdown support */}
      <MarkdownQuestionField
        value={question.question}
        onChange={(val) => update("question", val)}
        placeholder="Enter your question... (supports **markdown**)"
      />

      {/* MCQ options */}
      {question.type === "mcq" && (
        <div>
          <label className="text-xs font-medium text-gray-400 mb-2 block">
            Options (click to mark correct)
          </label>
          <div className="space-y-2">
            {question.options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => update("correctAnswer", idx)}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    question.correctAnswer === idx
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                      : "border-gray-600 text-gray-600 hover:border-gray-400"
                  }`}
                  title={question.correctAnswer === idx ? "Correct answer" : "Mark as correct"}
                >
                  <span className="text-xs font-bold">{String.fromCharCode(65 + idx)}</span>
                </button>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  disabled={question.options.length <= 2}
                  className="p-1.5 text-gray-600 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          {question.options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-400 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add option
            </button>
          )}
        </div>
      )}

      {/* True/False correct answer */}
      {question.type === "true_false" && (
        <div>
          <label className="text-xs font-medium text-gray-400 mb-2 block">Correct Answer</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => update("correctAnswer", true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                question.correctAnswer === true
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                  : "bg-gray-800 text-gray-400 border-gray-600 hover:border-gray-400"
              }`}
            >
              True
            </button>
            <button
              type="button"
              onClick={() => update("correctAnswer", false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                question.correctAnswer === false
                  ? "bg-red-500/20 text-red-400 border-red-500/50"
                  : "bg-gray-800 text-gray-400 border-gray-600 hover:border-gray-400"
              }`}
            >
              False
            </button>
          </div>
        </div>
      )}

      {/* Fill in the blank correct answer */}
      {question.type === "fill_blank" && (
        <div>
          <label className="text-xs font-medium text-gray-400 mb-1 block">Correct Answer</label>
          <input
            type="text"
            value={question.correctAnswer || ""}
            onChange={(e) => update("correctAnswer", e.target.value)}
            placeholder="The expected answer..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
          />
        </div>
      )}
    </>
  );
}

// Fields for coding type
function CodingFields({ question, onChange, fileNames = [] }) {
  const update = (field, value) => onChange({ ...question, [field]: value });

  return (
    <>
      <div>
        <label className="text-xs font-medium text-gray-400 mb-1 block">Challenge Title</label>
        <input
          type="text"
          value={question.title || ""}
          onChange={(e) => update("title", e.target.value)}
          placeholder="e.g., Fix the Bug"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
        />
      </div>
      <MarkdownQuestionField
        value={question.instruction}
        onChange={(val) => update("instruction", val)}
        placeholder="Describe what the student needs to do... (supports **markdown**)"
      />
      <div>
        <label className="text-xs font-medium text-gray-400 mb-1 block">File Name</label>
        {fileNames.length > 0 ? (
          <select
            value={question.fileName || ""}
            onChange={(e) => update("fileName", e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Select a file...</option>
            {fileNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={question.fileName || ""}
            onChange={(e) => update("fileName", e.target.value)}
            placeholder="e.g., Product.java"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
          />
        )}
      </div>
    </>
  );
}

// --- Rendering the create quiz screen ---

function QuizEditorModal({ isOpen, onClose, questions, onQuestionsChange, fileNames, videoDuration }) {
  const [nextId, setNextId] = useState(
    () => (questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1)
  );

  if (!isOpen) return null;

  const handleAdd = () => {
    onQuestionsChange([...questions, createEmptyQuestion(nextId)]);
    setNextId((prev) => prev + 1);
  };

  const handleChange = (index, updated) => {
    const newQuestions = [...questions];
    newQuestions[index] = updated;
    onQuestionsChange(newQuestions);
  };

  const handleDelete = (index) => {
    onQuestionsChange(questions.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="relative bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-3xl h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <HelpCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Quiz Editor</h3>
              <p className="text-xs text-gray-500">
                {questions.length} question{questions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <HelpCircle className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">No questions yet. Add your first question below.</p>
            </div>
          ) : (
            questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx}
                onChange={(updated) => handleChange(idx, updated)}
                onDelete={() => handleDelete(idx)}
                totalQuestions={questions.length}
                fileNames={fileNames}
                videoDuration={videoDuration}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-gray-900/50 shrink-0">
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuizEditor({ questions, onQuestionsChange, fileNames = [], videoDuration = 0 }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const typeLabel = (type) => QUIZ_TYPES.find((t) => t.value === type)?.label || type;

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
        <HelpCircle className="w-4 h-4 text-gray-500" />
        Video Quiz
        <span className="text-gray-500 font-normal">(Optional)</span>
      </label>

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full px-4 py-4 bg-gray-900/50 border border-gray-600 rounded-xl text-left hover:border-blue-500/50 hover:bg-gray-900/70 transition-all duration-200 group"
      >
        {questions && questions.length > 0 ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-300">
                {questions.length} question{questions.length !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {questions.map((q, i) => `${formatTime(q.time)} - ${typeLabel(q.type)}`).join(", ")}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-gray-500">
            <HelpCircle className="w-5 h-5 group-hover:text-blue-400 transition-colors" />
            <span className="group-hover:text-gray-400 transition-colors">
              Click to add quiz questions to the video...
            </span>
          </div>
        )}
      </button>

      <QuizEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        questions={questions || []}
        onQuestionsChange={onQuestionsChange}
        fileNames={fileNames}
        videoDuration={videoDuration}
      />
    </div>
  );
}
