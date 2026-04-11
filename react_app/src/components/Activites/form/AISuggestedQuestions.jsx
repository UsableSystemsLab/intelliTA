import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Sparkles, RefreshCw, Check, X, ChevronDown, ChevronUp,
  AlertTriangle, Loader, Clock, HelpCircle, ToggleLeft, PenLine,
  FileVideo, RotateCcw, Timer, Minus, Plus, Info,
} from "lucide-react";

const markdownComponents = {
  h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-semibold text-white mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold text-white mb-1">{children}</h3>,
  p: ({ children }) => <p className="text-gray-300 leading-relaxed text-sm">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-1 space-y-0.5 text-sm">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-1 space-y-0.5 text-sm">{children}</ol>,
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

import { API_BASE as API_SERVER, LLM_BASE as LLM_SERVER } from '../../../config/api';

// Server endpoints
const AUTH_HEADER = { Authorization: "Bearer 1111", "Content-Type": "application/json" };

const TYPE_META = {
  mcq:        { label: "MCQ",           icon: HelpCircle,  color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  true_false: { label: "True / False",  icon: ToggleLeft,  color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  fill_blank: { label: "Fill in Blank", icon: PenLine,     color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
};

// Convert seconds to MM:SS display format
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}


// Allows editing question text, options, and correct answer before accepting.
function SuggestionEditForm({ suggestion, onSave, onCancel }) {
  const [question, setQuestion] = useState(suggestion.question || "");
  const [options, setOptions]   = useState(suggestion.options || []);
  // Default correct answer depends on type: boolean for T/F, empty string for fill_blank, 0 for mcq
  const [correct, setCorrect]   = useState(suggestion.correctAnswer ?? (suggestion.type === "true_false" ? true : suggestion.type === "fill_blank" ? "" : 0));

  const save = () => onSave({ ...suggestion, question, options, correctAnswer: correct });

  return (
    <div className="px-4 pb-4 pt-3 space-y-3 border-t border-gray-700/50">
      {/* Question text */}
      <div>
        <label className="text-xs font-medium text-gray-400 mb-1 block">Question</label>
        <textarea
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {/* MCQ options*/}
      {suggestion.type === "mcq" && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-400 block">Options (click circle to mark correct)</label>
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCorrect(idx)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                  correct === idx
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                    : "border-gray-600 text-gray-600 hover:border-gray-400"
                }`}
              >
                {String.fromCharCode(65 + idx)}
              </button>
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const next = [...options];
                  next[idx] = e.target.value;
                  setOptions(next);
                }}
                className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          ))}
        </div>
      )}

      {/* True/False */}
      {suggestion.type === "true_false" && (
        <div>
          <label className="text-xs font-medium text-gray-400 mb-1.5 block">Correct Answer</label>
          <div className="flex gap-2">
            {[true, false].map((val) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => setCorrect(val)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                  correct === val
                    ? val ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-red-500/20 text-red-400 border-red-500/50"
                    : "bg-gray-800 text-gray-400 border-gray-600 hover:border-gray-400"
                }`}
              >
                {val ? "True" : "False"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fill blank */}
      {suggestion.type === "fill_blank" && (
        <div>
          <label className="text-xs font-medium text-gray-400 mb-1 block">Correct Answer</label>
          <input
            type="text"
            value={correct}
            onChange={(e) => setCorrect(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-gray-400 hover:text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

// for AI suggestion card
function SuggestionCard({ suggestion, onAccept, onReject, onRegenerate, onUpdate }) {
  const [editing, setEditing]     = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const meta = TYPE_META[suggestion.type] || TYPE_META.mcq; 
  const TypeIcon = meta.icon;

  // Save edited question and exit edit mode
  const handleSave = (updated) => {
    onUpdate(updated);
    setEditing(false);
  };

  return (
    <div className={`bg-gray-900/60 border rounded-xl overflow-hidden transition-opacity ${suggestion._regenerating ? "opacity-50 pointer-events-none" : "border-gray-700/80"}`}>
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`p-1.5 rounded-lg border shrink-0 ${meta.color}`}>
          <TypeIcon className="w-3.5 h-3.5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm text-white font-medium line-clamp-2">
            {suggestion.question ? (
              <ReactMarkdown components={markdownComponents}>{suggestion.question}</ReactMarkdown>
            ) : "…"}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">{meta.label}</span>
            <span className="text-gray-600">·</span>
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-500">{formatTime(suggestion.time ?? 0)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {suggestion._regenerating ? (
            <Loader className="w-4 h-4 text-gray-500 animate-spin" />
          ) : (
            <>
              <button
                type="button"
                title="Regenerate this question"
                onClick={onRegenerate}
                className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Edit before accepting"
                onClick={() => { setEditing(!editing); setCollapsed(false); }}
                className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${editing ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
              >
                Edit
              </button>
              <button
                type="button"
                title="Accept — add to quiz"
                onClick={onAccept}
                className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Reject"
                onClick={onReject}
                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="p-1.5 text-gray-600 hover:text-gray-300 rounded-lg transition-colors"
              >
                {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded preview */}
      {!collapsed && !editing && suggestion.type === "mcq" && suggestion.options?.length > 0 && (
        <div className="px-4 pb-3 space-y-1 border-t border-gray-800/60 pt-2">
          {suggestion.options.map((opt, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs ${
                suggestion.correctAnswer === idx
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-gray-500"
              }`}
            >
              <span className="font-bold w-4">{String.fromCharCode(65 + idx)}</span>
              <span className="flex-1"><ReactMarkdown components={markdownComponents}>{opt}</ReactMarkdown></span>
              {suggestion.correctAnswer === idx && <Check className="w-3 h-3 ml-auto shrink-0" />}
            </div>
          ))}
        </div>
      )}

      {!collapsed && !editing && suggestion.type === "true_false" && (
        <div className="px-4 pb-3 border-t border-gray-800/60 pt-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${suggestion.correctAnswer ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}>
            Answer: {suggestion.correctAnswer ? "True" : "False"}
          </span>
        </div>
      )}

      {!collapsed && !editing && suggestion.type === "fill_blank" && (
        <div className="px-4 pb-3 border-t border-gray-800/60 pt-2">
          <span className="text-xs text-gray-400">Answer: <span className="text-white font-medium">{suggestion.correctAnswer}</span></span>
        </div>
      )}

      {/* Inline edit form */}
      {editing && (
        <SuggestionEditForm
          suggestion={suggestion}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}

// Transcript status
function TranscriptStatus({ transcriptStatus, onTrigger, onRefresh, triggering, refreshing }) {
  if (transcriptStatus === null) {
    return (
      <div className="flex items-start gap-3 p-3 bg-gray-700/50 border border-gray-600 rounded-xl">
        <FileVideo className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-gray-300 font-medium">Transcript not processed yet</p>
          <p className="text-xs text-gray-500 mt-0.5">The video needs to be transcribed before AI questions can be generated.</p>
        </div>
        <button
          type="button"
          onClick={onTrigger}
          disabled={triggering}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-medium rounded-lg transition-colors shrink-0"
        >
          {triggering ? <Loader className="w-3 h-3 animate-spin" /> : <FileVideo className="w-3 h-3" />}
          Process Video
        </button>
      </div>
    );
  }

  if (transcriptStatus === "pending" || transcriptStatus === "processing") {
    return (
      <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <Loader className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-blue-300 font-medium capitalize">{transcriptStatus}…</p>
          <p className="text-xs text-gray-500 mt-0.5">This usually takes 1-2 minutes depends on video size. Check back soon.</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-700 text-xs font-medium rounded-lg transition-colors shrink-0"
        >
          <RotateCcw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
    );
  }

  if (transcriptStatus === "failed") {
    return (
      <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-red-300 font-medium">Transcription failed</p>
          <p className="text-xs text-gray-500 mt-0.5">The previous attempt failed. You can retry.</p>
        </div>
        <button
          type="button"
          onClick={onTrigger}
          disabled={triggering}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-xs font-medium rounded-lg transition-colors shrink-0"
        >
          {triggering ? <Loader className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
          Retry
        </button>
      </div>
    );
  }

  return null; // completed — nothing to show
}

// Interval selector
function IntervalSelector({ interval, setInterval, videoDuration }) {
  const durationMin = Math.max(1, Math.ceil((videoDuration || 0) / 60));  // video length in minutes
  const maxInterval = Math.max(1, durationMin);                           // can't exceed video length
  const questionCount = Math.max(1, Math.floor(durationMin / interval));  // estimated questions

  const clamp = (v) => Math.max(1, Math.min(v, maxInterval)); // keep value within valid range

  // Build visual timeline markers
  const markers = [];
  for (let i = 0; i < questionCount && i < 20; i++) {
    markers.push(i * interval);
  }

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-gray-300">Question every</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setInterval(clamp(interval - 1))}
            disabled={interval <= 1}
            className="p-1 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <input
            type="number"
            min={1}
            max={maxInterval}
            value={interval}
            onChange={(e) => setInterval(clamp(Number(e.target.value) || 1))}
            className="w-14 text-center px-2 py-1.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm font-medium focus:outline-none focus:border-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => setInterval(clamp(interval + 1))}
            disabled={interval >= maxInterval}
            className="p-1 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm text-gray-400">min</span>
        </div>

        <div className="h-5 w-px bg-gray-700 hidden sm:block" />

        <span className="text-sm font-medium text-purple-300">
          ~{questionCount} question{questionCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Visual timeline */}
      {videoDuration > 0 && (
        <div className="relative bg-gray-900/60 border border-gray-700/60 rounded-xl p-3 pt-2">
          <div className="flex items-center gap-1.5 mb-2">
            <Info className="w-3 h-3 text-gray-500" />
            <span className="text-[11px] text-gray-500">
              {durationMin} min video — one question generated per shaded segment
            </span>
          </div>

          {/* Timeline bar */}
          <div className="relative h-7 bg-gray-800 rounded-lg overflow-hidden">
            {markers.map((startMin, i) => {
              const leftPct = (startMin / durationMin) * 100;
              const widthPct = Math.min((interval / durationMin) * 100, 100 - leftPct);
              const colors = [
                "bg-purple-500/25 border-purple-500/40",
                "bg-blue-500/25 border-blue-500/40",
                "bg-emerald-500/25 border-emerald-500/40",
              ];
              return (
                <div
                  key={i}
                  className={`absolute top-0 h-full border-r ${colors[i % 3]} flex items-center justify-center`}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                >
                  {widthPct > 8 && (
                    <span className="text-[10px] text-gray-400 font-medium">Q{i + 1}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time labels */}
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-600">0:00</span>
            <span className="text-[10px] text-gray-600">
              {String(Math.floor(durationMin)).padStart(2, "0")}:{String(Math.round((videoDuration % 60))).padStart(2, "0")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}


export default function AISuggestedQuestions({ activityId, videoUrl, videoDuration, onInjectQuestions }) {
  const [status,            setStatus]            = useState("idle"); 
  const [suggestions,       setSuggestions]       = useState([]);     
  const [error,             setError]             = useState("");
  const [intervalMin,       setIntervalMin]       = useState(5);      

  // Transcript lifecycle state
  const [transcriptStatus,  setTranscriptStatus]  = useState("checking"); 
  
  const [transcriptId,      setTranscriptId]      = useState(null);
  const [triggering,        setTriggering]        = useState(false);     
  const [refreshing,        setRefreshing]        = useState(false);      

  // Check transcript status on mount 
  const checkTranscript = async () => {
    if (!activityId) return;

    try {
      const resp = await fetch(`${API_SERVER}/transcripts/activities/${activityId}`, {
        headers: AUTH_HEADER,
      });
      if (resp.status === 404) { setTranscriptStatus(null); return; }
      if (!resp.ok) { setTranscriptStatus(null); return; }
      const data = await resp.json();
      setTranscriptStatus(data.status);
      setTranscriptId(data.transcript_id ?? null);
    } catch {
      setTranscriptStatus(null);
    }
  };

  useEffect(() => {
    checkTranscript();
  }, [activityId]);

  // Check for transcriptStatus every 15 seconds while processing
  useEffect(() => {
    if (transcriptStatus !== "pending" && transcriptStatus !== "processing") return;
    const id = setInterval(checkTranscript, 15000);
    return () => clearInterval(id);
  }, [transcriptStatus]);

  // Sends a POST to start video transcription and set status to pending
  const handleTrigger = async () => {
    if (!activityId || !videoUrl) return;
    setTriggering(true);
    try {
      const resp = await fetch(`${API_SERVER}/transcripts/trigger`, {
        method: "POST",
        headers: AUTH_HEADER,
        body: JSON.stringify({ activityId, videoUrl }),
      });
      if (resp.ok) {
        setTranscriptStatus("pending");
      }
    } catch {

    } finally {
      setTriggering(false);
    }
  };

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    await checkTranscript();
    setRefreshing(false);
  };

  
  // Core function that calls the LLM server's /quiz/suggest endpoint.

  const callSuggest = async (timeRange = null) => {
    const body = { activity_id: activityId, interval_minutes: intervalMin };
    if (timeRange) body.time_range = timeRange;

    const resp = await fetch(`${LLM_SERVER}/quiz/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(`Server error ${resp.status}`);
    return resp.json();
  };


  const stamp = () => Date.now() + Math.random();

  
  const handleGenerate = async () => {
    setStatus("loading");
    setError("");
    setSuggestions([]);
    try {
      const data = await callSuggest();
      if (data.error) { setError(data.message || "Generation failed."); setStatus("error"); return; }
      setSuggestions((data.quizzes || []).map((q) => ({ ...q, _key: stamp() })));
      setStatus("done");
    } catch {
      setError("Failed to reach the AI service. Is the LLM server running?");
      setStatus("error");
    }
  };

  // Regenerate a single question 
  const handleRegenerate = async (key) => {
    const s = suggestions.find((x) => x._key === key);
    if (!s) return;
    const margin = 150;
    const timeRange = {
      start_seconds: Math.max(0, (s.time ?? 0) - margin),
      end_seconds: (s.time ?? 0) + margin,
    };
    setSuggestions((prev) => prev.map((x) => x._key === key ? { ...x, _regenerating: true } : x));
    try {
      const data = await callSuggest(timeRange);
      const newQ = (data.quizzes || [])[0];
      if (newQ) {
        setSuggestions((prev) => prev.map((x) => x._key === key ? { ...newQ, _key: key } : x));
      } else {
        setSuggestions((prev) => prev.map((x) => x._key === key ? { ...x, _regenerating: false } : x));
      }
    } catch {
      setSuggestions((prev) => prev.map((x) => x._key === key ? { ...x, _regenerating: false } : x));
    }
  };

  
  const handleAccept = (key) => {
    const s = suggestions.find((x) => x._key === key);
    if (!s) return;
    const { _key, _regenerating, ...question } = s; 
    onInjectQuestions([question]);
    setSuggestions((prev) => prev.filter((x) => x._key !== key));
  };

  // Accept all remaining suggestions at once
  const handleAcceptAll = () => {
    const questions = suggestions.map(({ _key, _regenerating, ...q }) => q);
    onInjectQuestions(questions);
    setSuggestions([]);
    setStatus("idle");
  };
  const handleReject = (key) => setSuggestions((prev) => prev.filter((x) => x._key !== key));
  const handleRejectAll = () => {
    setSuggestions([]);
    setStatus("idle");
  };
  const handleUpdate = (key, updated) =>
    setSuggestions((prev) => prev.map((x) => x._key === key ? { ...updated, _key: key } : x));


  return (
    <div className="bg-gray-800/40 border border-purple-500/20 rounded-xl overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-purple-300">AI Suggested Questions</span>
          {suggestions.length > 0 && (
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-medium">
              {suggestions.length}
            </span>
          )}
        </div>
        {suggestions.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRejectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Reject All
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Accept All
            </button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Transcript status banner */}
        {transcriptStatus !== "completed" && (
          <TranscriptStatus
            transcriptStatus={transcriptStatus === "checking" ? "pending" : transcriptStatus}
            onTrigger={handleTrigger}
            onRefresh={handleRefreshStatus}
            triggering={triggering}
            refreshing={refreshing || transcriptStatus === "checking"}
          />
        )}

        {/* only when transcript is ready */}
        {transcriptStatus === "completed" && (
          <div className="space-y-3">
            <IntervalSelector
              interval={intervalMin}
              setInterval={setIntervalMin}
              videoDuration={videoDuration || 0}
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={status === "loading"}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
            >
              {status === "loading" ? (
                <><Loader className="w-4 h-4 animate-spin" /> Generating…</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate Questions</>
              )}
            </button>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Suggestion cards */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((s) => (
              <SuggestionCard
                key={s._key}
                suggestion={s}
                onAccept={() => handleAccept(s._key)}
                onReject={() => handleReject(s._key)}
                onRegenerate={() => handleRegenerate(s._key)}
                onUpdate={(updated) => handleUpdate(s._key, updated)}
              />
            ))}
          </div>
        )}

        {/* Empty accepted state */}
        {status === "done" && suggestions.length === 0 && (
          <p className="text-xs text-center text-gray-500 py-2">
            All suggestions accepted or rejected.
          </p>
        )}


        {/* Idle hint */}
        {transcriptStatus === "completed" && status === "idle" && (
          <p className="text-xs text-gray-500 text-center">
            Click <span className="text-purple-400 font-medium">Generate Questions</span> to get AI-suggested questions based on the video transcript.
          </p>
        )}
      </div>
    </div>
  );
}
