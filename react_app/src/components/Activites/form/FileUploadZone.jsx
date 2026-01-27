import { Upload } from "lucide-react";
export default function FileUploadZone({
  id,
  accept,
  file,
  onFileChange,
  icon: Icon = Upload,
  label = "Click to upload file",
  activeLabel,
}) {
  const hasFile = !!file;
  const displayLabel = hasFile ? (activeLabel || file.name) : label;

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
        hasFile
          ? "border-green-500/50 bg-green-500/5"
          : "border-gray-700 hover:border-gray-600 hover:bg-gray-700/30"
      }`}
    >
      <input
        type="file"
        accept={accept}
        id={id}
        className="hidden"
        onChange={(e) => onFileChange(e.target.files[0])}
      />
      <label htmlFor={id} className="cursor-pointer flex flex-col items-center">
        <div className={`p-3 rounded-xl mb-3 ${hasFile ? "bg-green-500/10" : "bg-gray-700/50"}`}>
          <Icon className={`w-6 h-6 ${hasFile ? "text-green-400" : "text-gray-400"}`} />
        </div>
        <span className={`text-sm ${hasFile ? "text-green-400" : "text-gray-400"}`}>
          {displayLabel}
        </span>
      </label>
    </div>
  );
}
