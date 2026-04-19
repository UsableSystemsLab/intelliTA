import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  List,
  X,
  Plus,
  Trash2,
  ChevronDown,
  GripVertical,
  Clock,
  Play,
  AlertTriangle,
} from "lucide-react";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseTimeInput(value) {
  if (value.includes(":")) {
    const [m, s] = value.split(":").map(Number);
    return (m || 0) * 60 + (s || 0);
  }
  return parseInt(value, 10) || 0;
}

function createEmptyChapter(id) {
  return {
    id,
    title: "",
    start_time_seconds: 0,
  };
}

function ChapterCard({ chapter, index, onChange, onDelete, videoDuration, getVideoTime }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  const update = (field, value) => {
    onChange({ ...chapter, [field]: value });
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors"
      >
        <GripVertical className="w-4 h-4 text-gray-600 shrink-0" />
        <div className="p-1.5 rounded-lg border text-blue-400 bg-blue-500/10 border-blue-500/30">
          <List className="w-4 h-4" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <span className="text-sm text-white font-medium line-clamp-1 block">
            {chapter.title || `Chapter ${index + 1}`}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(chapter.start_time_seconds)}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-700/50 pt-4">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">{t('chapterTitle')}</label>
            <input
              type="text"
              value={chapter.title || ""}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g., Introduction"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">
              {t('startTimeMmSs')}
              {videoDuration > 0 && (
                <span className="text-gray-600 font-normal ml-1">{t('maxLabel')} {formatTime(videoDuration)}</span>
              )}
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={formatTime(chapter.start_time_seconds)}
                onChange={(e) => {
                  let parsed = parseTimeInput(e.target.value);
                  if (videoDuration > 0 && parsed > videoDuration) parsed = videoDuration;
                  update("start_time_seconds", parsed);
                }}
                placeholder="00:00"
                className={`w-full pl-9 pr-3 py-2 bg-gray-800 border rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 ${
                  videoDuration > 0 && chapter.start_time_seconds > videoDuration ? "border-red-500" : "border-gray-600"
                }`}
              />
            </div>
            {getVideoTime && (
              <button
                type="button"
                onClick={() => {
                  let t = getVideoTime();
                  if (videoDuration > 0 && t > videoDuration) t = videoDuration;
                  update("start_time_seconds", t);
                }}
                className="mt-1.5 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 hover:text-blue-300 rounded-lg text-xs font-medium transition-all"
              >
                <Play className="w-3 h-3" />
                {t('useCurrentVideoTime')}
              </button>
            )}
            {videoDuration > 0 && chapter.start_time_seconds > videoDuration && (
              <p className="flex items-center gap-1 text-[10px] text-red-400 mt-0.5">
                <AlertTriangle className="w-3 h-3" />
                {t('exceedsVideoDuration')} {"("}{formatTime(videoDuration)}{")"}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('remove')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChaptersEditorModal({ isOpen, onClose, chapters, onChaptersChange, videoDuration, videoFile, videoUrl }) {
  const { t } = useTranslation();
  const [nextId, setNextId] = useState(
    () => (chapters.length > 0 ? Math.max(...chapters.map((c) => c.id || 0)) + 1 : 1)
  );
  const [videoSrc, setVideoSrc] = useState(null);
  const [leftWidth, setLeftWidth] = useState(45);
  const [dragging, setDragging] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const handleDividerMouseDown = () => {
    isDragging.current = true;
    setDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    setLeftWidth(Math.min(Math.max(newWidth, 25), 70));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    setDragging(false);
  };

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoSrc(url);
      return () => URL.revokeObjectURL(url);
    } else if (videoUrl) {
      setVideoSrc(videoUrl);
    } else {
      setVideoSrc(null);
    }
  }, [videoFile, videoUrl]);

  const getVideoTime = videoSrc
    ? () => Math.floor(videoRef.current?.currentTime ?? 0)
    : null;

  if (!isOpen) return null;

  const handleAdd = () => {
    onChaptersChange([...chapters, createEmptyChapter(nextId)]);
    setNextId((prev) => prev + 1);
  };

  const handleChange = (index, updated) => {
    const newChapters = [...chapters];
    newChapters[index] = updated;
    onChaptersChange(newChapters);
  };

  const handleDelete = (index) => {
    onChaptersChange(chapters.filter((_, i) => i !== index));
  };

  // Sort chapters by time for display
  const sortedChapters = [...chapters].sort((a, b) => a.start_time_seconds - b.start_time_seconds);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="relative bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <List className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{t('videoChapters')}</h3>
              <p className="text-xs text-gray-500">
                {chapters.length} {chapters.length !== 1 ? t('chapters') : t('chapter')}
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

        {/* Body */}
        <div
          ref={containerRef}
          className={`flex flex-1 overflow-hidden ${dragging ? "cursor-col-resize select-none" : ""}`}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Left panel: video */}
          {videoSrc && (
            <div
              style={{ width: `${leftWidth}%` }}
              className="shrink-0 flex flex-col gap-4 bg-black/30 p-5 overflow-hidden"
            >
              <video
                ref={videoRef}
                src={videoSrc}
                controls
                className="w-full rounded-xl"
              />
              <div className="flex flex-col gap-2">
                {[
                  { step: "1", text: "Play the video" },
                  { step: "2", text: "Pause at chapter start" },
                  { step: "3", text: 'Click "Use current video time"' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {step}
                    </span>
                    <span className="text-sm text-gray-300">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Draggable divider */}
          {videoSrc && (
            <div
              onMouseDown={handleDividerMouseDown}
              className={`w-3 shrink-0 cursor-col-resize flex items-center justify-center group transition-colors ${
                dragging ? "bg-blue-500/40" : "bg-gray-600/60 hover:bg-blue-500/40"
              }`}
            >
              <div className={`w-1 h-12 rounded-full transition-all ${
                dragging ? "bg-blue-400 opacity-100" : "bg-gray-400 opacity-60 group-hover:bg-blue-400 group-hover:opacity-100"
              }`} />
            </div>
          )}

          {/* Right panel: chapter list */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {chapters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <List className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">{t('noChaptersYet')}</p>
              </div>
            ) : (
              sortedChapters.map((chapter, idx) => {
                const originalIndex = chapters.findIndex(c => c.id === chapter.id);
                return (
                  <ChapterCard
                    key={chapter.id}
                    chapter={chapter}
                    index={idx}
                    onChange={(updated) => handleChange(originalIndex, updated)}
                    onDelete={() => handleDelete(originalIndex)}
                    videoDuration={videoDuration}
                    getVideoTime={getVideoTime}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-gray-900/50 shrink-0">
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addChapter')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-colors"
          >
            {t('done')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChaptersEditor({ chapters, onChaptersChange, videoDuration = 0, videoFile = null, videoUrl = null }) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
        <List className="w-4 h-4 text-gray-500" />
        {t('videoChapters')}
        <span className="text-gray-500 font-normal">{t('optional')}</span>
      </label>

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full px-4 py-4 bg-gray-900/50 border border-gray-600 rounded-xl text-left hover:border-blue-500/50 hover:bg-gray-900/70 transition-all duration-200 group"
      >
        {chapters && chapters.length > 0 ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center">
              <List className="w-5 h-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-300">
                {chapters.length} {chapters.length !== 1 ? t('chapters') : t('chapter')}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {chapters
                  .sort((a, b) => a.start_time_seconds - b.start_time_seconds)
                  .map((c) => `${formatTime(c.start_time_seconds)} - ${c.title || "Untitled"}`)
                  .join(", ")}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-gray-500">
            <List className="w-5 h-5 group-hover:text-blue-400 transition-colors" />
            <span className="group-hover:text-gray-400 transition-colors">
              {t('clickToAddChapters')}
            </span>
          </div>
        )}
      </button>

      <ChaptersEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        chapters={chapters || []}
        onChaptersChange={onChaptersChange}
        videoDuration={videoDuration}
        videoFile={videoFile}
        videoUrl={videoUrl}
      />
    </div>
  );
}
