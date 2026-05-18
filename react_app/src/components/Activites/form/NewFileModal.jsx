import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import { FILE_LANGUAGES } from "./fileLanguages";

export default function NewFileModal({
  isOpen,
  onClose,
  onConfirm,
  existingNames = [],
  lockedLanguageId = null,
  initial = null, // { basename, path, languageId } when renaming
  title = "New file",
}) {
  const [languageId, setLanguageId] = useState(lockedLanguageId || initial?.languageId || FILE_LANGUAGES[0].id);
  const [basename, setBasename] = useState(initial?.basename || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setLanguageId(lockedLanguageId || initial?.languageId || FILE_LANGUAGES[0].id);
    setBasename(initial?.basename || "");
    setError("");
  }, [isOpen, initial, lockedLanguageId]);

  if (!isOpen) return null;

  const lang = FILE_LANGUAGES.find((l) => l.id === languageId) || FILE_LANGUAGES[0];

  const buildFinalName = () => {
    const cleanBase = basename.trim();
    if (!cleanBase) return "";
    return `${cleanBase}.${lang.extension}`;
  };

  const handleConfirm = () => {
    setError("");
    const finalName = buildFinalName();
    if (!finalName) {
      setError("Filename is required");
      return;
    }
    if (existingNames.includes(finalName)) {
      setError(`A file named "${finalName}" already exists`);
      return;
    }
    onConfirm({ filename: finalName, languageId: lang.id });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="relative bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-green-400" />
            <h3 className="text-base font-semibold text-white">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {!lockedLanguageId && (
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">File type</label>
              <select
                value={languageId}
                onChange={(e) => setLanguageId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
              >
                {FILE_LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label} (.{l.extension})
                  </option>
                ))}
              </select>
            </div>
          )}

          {lockedLanguageId && (
            <div className="text-xs text-gray-500 -mb-1">
              Locked to <span className="text-gray-300 font-medium">{lang.label}</span> for this activity's tests.
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Filename</label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={basename}
                onChange={(e) => setBasename(e.target.value)}
                placeholder="main"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                className="flex-1 min-w-0 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
              />
              <span className="text-sm text-gray-500 px-2 select-none">.{lang.extension}</span>
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700 bg-gray-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
