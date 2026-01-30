import { useState, useEffect } from "react";
import { Calendar, Type } from "lucide-react";
import FormInput from "./form/FormInput";
import SubmitButton from "./form/SubmitButton";
import StarterCodeEditor from "./form/StarterCodeEditor";
import MarkdownEditor from "./form/MarkdownEditor";
import { ModalHeader, ErrorAlert, CloseButton } from "./form/ModalComponents";

export default function EditActivityModal({ isOpen, onClose, courseId, activity, onActivityUpdated }) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [mdContent, setMdContent] = useState("");
  const [starterFiles, setStarterFiles] = useState([]);
  const [starterPrompt, setStarterPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Populate form when activity changes
  useEffect(() => {
    if (activity) {
      setTitle(activity.title || "");
      // Format dates for datetime-local input
      if (activity.start_date) {
        const start = new Date(activity.start_date);
        setStartDate(formatDateForInput(start));
      }
      if (activity.end_date) {
        const end = new Date(activity.end_date);
        setEndDate(formatDateForInput(end));
      }

      // Fetch content
      fetchContent(activity);
    }
  }, [activity]);

  const fetchContent = async (activity) => {
    setLoadingContent(true);
    try {
      // Fetch markdown content if URL exists
      if (activity.md_file_url) {
        const mdResponse = await fetch(activity.md_file_url);
        if (mdResponse.ok) {
          const mdText = await mdResponse.text();
          setMdContent(mdText);
        }
      } else {
        setMdContent("");
      }

      // Fetch starter code if URL exists
      if (activity.starter_code_url) {
        const codeResponse = await fetch(activity.starter_code_url);
        if (codeResponse.ok) {
          const codeData = await codeResponse.json();
          setStarterFiles(codeData);
        }
      } else {
        setStarterFiles([]);
      }
    } catch (err) {
      console.error("Failed to fetch content:", err);
      setMdContent("");
      setStarterFiles([]);
    } finally {
      setLoadingContent(false);
    }
  };

  const formatDateForInput = (date) => {
    // Format: YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  if (!isOpen || !activity) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("start_date", new Date(startDate).toISOString());
      formData.append("end_date", new Date(endDate).toISOString());

      // Add markdown content if exists
      if (mdContent.trim()) {
        const mdBlob = new Blob([mdContent], { type: "text/markdown" });
        const mdFile = new File([mdBlob], "content.md", { type: "text/markdown" });
        formData.append("md_file", mdFile);
      }

      // Add starter code if files exist
      if (starterFiles && starterFiles.length > 0) {
        const starterCodeJson = JSON.stringify(starterFiles);
        const starterCodeBlob = new Blob([starterCodeJson], { type: "application/json" });
        const starterCodeFile = new File([starterCodeBlob], "starter-code.json", { type: "application/json" });
        formData.append("starter_code", starterCodeFile);
      }

      const response = await fetch(
        `http://localhost:4000/api/courses/${courseId}/activities/${activity.activity_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: "Bearer 1111",
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Failed to update activity");
      }

      const updatedActivity = await response.json();
      onActivityUpdated(updatedActivity);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-lg w-full shadow-2xl text-white overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl" />

        <CloseButton onClick={onClose} />

        <div className="relative z-10">
          <ModalHeader
            title="Edit Activity"
            subtitle="Update activity details"
          />

          <ErrorAlert message={errorMsg} />

          {loadingContent ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-gray-400">Loading activity content...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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

              {/* Submit Button */}
              <SubmitButton
                loading={loading}
                label="Save Changes"
                loadingLabel="Saving..."
                className="mt-2"
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
