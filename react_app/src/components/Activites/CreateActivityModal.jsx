import { useState } from "react";
import { Upload, Calendar, Type } from "lucide-react";
import FormInput from "./form/FormInput";
import FileUploadZone from "./form/FileUploadZone";
import SubmitButton from "./form/SubmitButton";
import MarkdownEditor from "./form/MarkdownEditor";
import { ModalHeader, ErrorAlert, CloseButton } from "./form/ModalComponents";

export default function CreateActivityModal({ isOpen, onClose, courseId, onActivityCreated }) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [mdContent, setMdContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle("");
    setStartDate("");
    setEndDate("");
    setVideoFile(null);
    setMdContent("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      onActivityCreated(newActivity);
      onClose();
      resetForm();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-lg w-full shadow-2xl text-white overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl" />

        <CloseButton onClick={onClose} />

        <div className="relative z-10">
          <ModalHeader
            title="Create Activity"
            subtitle="Add a new interactive lesson"
          />

          <ErrorAlert message={errorMsg} />

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
                onFileChange={setVideoFile}
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

            {/* Submit Button */}
            <SubmitButton
              loading={loading}
              label="Create Activity"
              loadingLabel="Creating..."
              className="mt-2"
            />
          </form>
        </div>
      </div>
    </div>
  );
}
