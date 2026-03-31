import { useState } from "react";
import { Upload, Calendar, Type, ArrowLeft, Eye, FileCode, Code2, Send, Loader, HelpCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import FormInput from "./form/FormInput";
import FileUploadZone from "./form/FileUploadZone";
import SubmitButton from "./form/SubmitButton";
import MarkdownEditor from "./form/MarkdownEditor";
import StarterCodeEditor from "./form/StarterCodeEditor";
import QuizEditor from "./form/QuizEditor";
import ChaptersEditor from "./form/ChaptersEditor";
import { ModalHeader, ErrorAlert, CloseButton } from "./form/ModalComponents";

const markdownComponents = {
  h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4 pb-2 border-b border-gray-700">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-semibold text-white mb-3 mt-6">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-semibold text-white mb-2 mt-4">{children}</h3>,
  p: ({ children }) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="text-gray-300">{children}</li>,
  strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return <code className="text-blue-300 text-sm font-mono">{children}</code>;
    }
    return <code className="bg-gray-800 px-1.5 py-0.5 rounded text-blue-400 text-sm font-mono">{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4 border border-gray-700">{children}</pre>
  ),
  a: ({ href, children }) => (
    <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400 mb-4 bg-gray-800/50 py-2 rounded-r">{children}</blockquote>
  ),
  hr: () => <hr className="border-gray-700 my-6" />,
};

export default function CreateActivityModal({ isOpen, onClose, courseId, onActivityCreated }) {
  // New state added to know which step I'm in, for example 1 = im in form, 2 = im in preview
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [mdContent, setMdContent] = useState("");
  const [starterFiles, setStarterFiles] = useState([]);
  const [starterPrompt, setStarterPrompt] = useState("");
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;
// when reset the form we go back to step 1, also clear the error messages if exist
  const resetForm = () => {
    setStep(1);
    setTitle("");
    setStartDate("");
    setEndDate("");
    setVideoFile(null);
    setVideoDuration(0);
    setMdContent("");
    setStarterFiles([]);
    setStarterPrompt("");
    setQuizQuestions([]);
    setChapters([]);
    setErrorMsg("");
  };
// Extract video duration
  const handleVideoChange = (file) => {
    setVideoFile(file);
    if (file) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        setVideoDuration(Math.floor(video.duration));
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(file);
    } else {
      setVideoDuration(0);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };
// when submit we move to step 2 instead calling the API
  const handleGoToPreview = (e) => {
    e.preventDefault();
    setErrorMsg("");

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      setErrorMsg("End date must be after the start date.");
      return;
    }

    setStep(2);
  };
  // rename the method. Also this will call the API after verfying that the lab is good and correct by instructor
  const handlePublish = async () => {
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("start_date", new Date(startDate).toISOString());
    formData.append("end_date", new Date(endDate).toISOString());

    if (videoFile) {
      formData.append("video", videoFile);
    }

    if (mdContent.trim()) {
      const mdBlob = new Blob([mdContent], { type: "text/markdown" });
      const mdFile = new File([mdBlob], "content.md", { type: "text/markdown" });
      formData.append("md_file", mdFile);
    }

    if (starterFiles && starterFiles.length > 0) {
      const starterCodeJson = JSON.stringify(starterFiles);
      const starterCodeBlob = new Blob([starterCodeJson], { type: "application/json" });
      const starterCodeFile = new File([starterCodeBlob], "starter-code.json", { type: "application/json" });
      formData.append("starter_code", starterCodeFile);
    }

    try {
      const response = await fetch(`http://localhost:4000/api/courses/${courseId}/activities`, {
        method: "POST",
        headers: { Authorization: "Bearer 1111" },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Create Activity Error Details:", data);
        throw new Error(data.error || data.message || "Failed to create activity");
      }

      const newActivity = await response.json();

      // Save quiz questions to DB via API
      if (quizQuestions && quizQuestions.length > 0) {
        const quizPayload = {
          quizzes: quizQuestions.map(({ id, time, type, question, options, correctAnswer, title, instruction, fileName, hint, check }) => {
            const base = { id, time, type };
            if (type === "mcq") return { ...base, question, options, correctAnswer };
            if (type === "true_false") return { ...base, question, correctAnswer };
            if (type === "fill_blank") return { ...base, question, correctAnswer };
            if (type === "coding") return { ...base, title, instruction, fileName, hint, check };
            return base;
          }),
        };
        await fetch(
          `http://localhost:4000/api/courses/${courseId}/activities/${newActivity.activity_id}/quiz`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer 1111" },
            body: JSON.stringify(quizPayload),
          }
        );
      }

      // Save video chapters to DB via API
      if (chapters && chapters.length > 0) {
        const chaptersPayload = {
          chapters: chapters.map(({ title, start_time_seconds }) => ({
            title,
            start_time_seconds,
          })),
        };
        await fetch(
          `http://localhost:4000/api/courses/${courseId}/activities/${newActivity.activity_id}/chapters`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer 1111" },
            body: JSON.stringify(chaptersPayload),
          }
        );
      }

      onActivityCreated(newActivity);
      handleClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };
  // formatting the date in preview content
  const formatPreviewDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Step 2: Preview / Review
  if (step === 2) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="relative bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-[95vw] h-[90vh] shadow-2xl text-white flex flex-col overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-green-500/10 rounded-full blur-3xl" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
            <ModalHeader
              title="Review & Publish"
              subtitle="Review your activity before publishing"
            />
            <CloseButton onClick={handleClose} absolute={false} />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6 relative z-10">
            <ErrorAlert message={errorMsg} />

            {/* Activity Details */}
            <div className="mb-6 p-5 bg-gray-900/50 rounded-xl border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Type className="w-5 h-5 text-blue-400" />
                Activity Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Title</span>
                  <p className="text-white mt-1">{title}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Video</span>
                  <p className="text-gray-300 mt-1">{videoFile ? videoFile.name : "No video"}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</span>
                  <p className="text-gray-300 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    {formatPreviewDate(startDate)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</span>
                  <p className="text-gray-300 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    {formatPreviewDate(endDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Markdown Content Preview */}
            {mdContent && (
              <div className="mb-6 p-5 bg-gray-900/50 rounded-xl border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-green-400" />
                  Content Preview
                </h3>
                <div className="bg-gray-900/50 p-5 rounded-lg border border-gray-600">
                  <ReactMarkdown components={markdownComponents}>
                    {mdContent}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Starter Code Preview */}
            {starterFiles && starterFiles.length > 0 && (
              <div className="mb-6 p-5 bg-gray-900/50 rounded-xl border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-purple-400" />
                  Starter Code
                  <span className="text-sm font-normal text-gray-500">
                    ({starterFiles.length} file{starterFiles.length !== 1 ? "s" : ""})
                  </span>
                </h3>
                <div className="space-y-3">
                  {starterFiles.map((file) => (
                    <div key={file.name} className="bg-gray-900/50 rounded-lg border border-gray-600 overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 border-b border-gray-600">
                        <FileCode className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-mono text-gray-300">{file.name}</span>
                      </div>
                      <pre className="p-3 text-sm font-mono text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
                        <code>{file.content}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quiz Preview */}
            {quizQuestions && quizQuestions.length > 0 && (
              <div className="mb-6 p-5 bg-gray-900/50 rounded-xl border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-400" />
                  Video Quiz
                  <span className="text-sm font-normal text-gray-500">
                    ({quizQuestions.length} question{quizQuestions.length !== 1 ? "s" : ""})
                  </span>
                </h3>
                <div className="space-y-2">
                  {quizQuestions.map((q, idx) => {
                    const mins = Math.floor(q.time / 60);
                    const secs = q.time % 60;
                    const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
                    return (
                      <div key={q.id} className="flex items-center gap-3 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                        <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">{timeStr}</span>
                        <span className="text-xs text-gray-500 uppercase">{q.type.replace("_", "/")}</span>
                        <span className="text-sm text-gray-300 truncate">{q.question || q.title || `Question ${idx + 1}`}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chapters Preview */}
            {chapters && chapters.length > 0 && (
              <div className="mb-6 p-5 bg-gray-900/50 rounded-xl border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-400" />
                  Video Chapters
                  <span className="text-sm font-normal text-gray-500">
                    ({chapters.length} chapter{chapters.length !== 1 ? "s" : ""})
                  </span>
                </h3>
                <div className="space-y-2">
                  {[...chapters]
                    .sort((a, b) => a.start_time_seconds - b.start_time_seconds)
                    .map((chapter, idx) => {
                      const mins = Math.floor(chapter.start_time_seconds / 60);
                      const secs = chapter.start_time_seconds % 60;
                      const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
                      return (
                        <div key={chapter.id || idx} className="flex items-center gap-3 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                          <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">{timeStr}</span>
                          <span className="text-sm text-gray-300 truncate">{chapter.title || `Chapter ${idx + 1}`}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-700 bg-gray-900/50 shrink-0">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Edit
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Publish Lab
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Form
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-lg w-full max-h-[90vh] shadow-2xl text-white overflow-y-auto">
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <CloseButton onClick={handleClose} />

        <div className="relative z-10">
          <ModalHeader
            title="Create Activity"
            subtitle="Add a new interactive lesson"
          />

          <ErrorAlert message={errorMsg} />

          <form onSubmit={handleGoToPreview} className="space-y-5">
            {/* Activity Name */}
            <FormInput
              label="Activity Name"
              icon={Type}
              required
              placeholder="e.g., Introduction to React Hooks"
              value={title}
              onChange={setTitle}
            />

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Start Date"
                icon={Calendar}
                type="datetime-local"
                required
                value={startDate}
                onChange={setStartDate}
              />
              <FormInput
                label="End Date"
                icon={Calendar}
                type="datetime-local"
                required
                value={endDate}
                onChange={setEndDate}
                min={startDate}
              />
            </div>

            {/* Video Upload */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                Video
                <span className="text-gray-500 font-normal">(Optional)</span>
              </label>

              <FileUploadZone
                id="video-upload"
                accept="video/*"
                file={videoFile}
                onFileChange={handleVideoChange}
                icon={Upload}
                label="Click to upload video"
              />
            </div>

            {/* Markdown Content */}
            <MarkdownEditor
              value={mdContent}
              onChange={setMdContent}
              label="Markdown Content"
            />

            {/* Starter Code */}
            <StarterCodeEditor
              files={starterFiles}
              onFilesChange={setStarterFiles}
              prompt={starterPrompt}
              onPromptChange={setStarterPrompt}
            />

            {/* Video Quiz */}
            <QuizEditor
              questions={quizQuestions}
              onQuestionsChange={setQuizQuestions}
              fileNames={starterFiles.map(f => f.name)}
              videoDuration={videoDuration}
              videoFile={videoFile}
            />

            {/* Video Chapters */}
            <ChaptersEditor
              chapters={chapters}
              onChaptersChange={setChapters}
              videoDuration={videoDuration}
              videoFile={videoFile}
            />

            {/* Next: Review Button */}
            <SubmitButton
              loading={false}
              label="Next: Review & Preview"
              icon={Eye}
              className="mt-2"
            />
          </form>
        </div>
      </div>
    </div>
  );
}
