import { useState, useEffect } from "react";
import { X, CheckCircle2, XCircle, GitBranch, Loader, AlertCircle, ExternalLink, ShieldCheck, ShieldAlert } from "lucide-react";
import { API_BASE, getAuthHeaders } from "../../config/api";
import { auth } from "@/utils/firebase.js";

export default function AcceptanceModal({ courseId, activityId, activityTitle, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAcceptances() {
      try {
        const res = await fetch(
          `${API_BASE}/courses/${courseId}/activities/${activityId}/github-acceptances`,
          { headers: await getAuthHeaders(auth.currentUser) }
        );
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to fetch");
        }
        setData(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAcceptances();
  }, [courseId, activityId]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[85vh] shadow-2xl text-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-blue-400" />
              Assignment Tracking
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">{activityTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="w-8 h-8 text-blue-400 animate-spin mb-3" />
              <p className="text-gray-400">Fetching from GitHub Classroom...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {data && (
            <>
              {/* Summary bar */}
              <div className="flex items-center gap-4 mb-5 p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                <div className="flex-1 text-center">
                  <p className="text-2xl font-bold text-white">{data.total_enrolled}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Enrolled</p>
                </div>
                <div className="w-px h-10 bg-gray-700" />
                <div className="flex-1 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{data.accepted_count}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Accepted</p>
                </div>
                <div className="w-px h-10 bg-gray-700" />
                <div className="flex-1 text-center">
                  <p className="text-2xl font-bold text-red-400">{data.total_enrolled - data.accepted_count}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Pending</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-700 rounded-full mb-5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-500"
                  style={{ width: `${data.total_enrolled > 0 ? (data.accepted_count / data.total_enrolled) * 100 : 0}%` }}
                />
              </div>

              {/* Student list */}
              <div className="space-y-2">
                {data.students.map((s) => (
                  <div
                    key={s.user_id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                      s.accepted
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-gray-900/50 border-gray-700"
                    }`}
                  >
                    {/* Status icon */}
                    {s.accepted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-500 shrink-0" />
                    )}

                    {/* Student info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{s.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {s.github_username ? (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                            {s.github_verified ? (
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <ShieldAlert className="w-3 h-3 text-amber-400" />
                            )}
                            @{s.github_username}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">No GitHub linked</span>
                        )}
                      </div>
                    </div>

                    {/* Commit count + repo link */}
                    {s.accepted && (
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-gray-400">
                          {s.commit_count} commit{s.commit_count !== 1 ? "s" : ""}
                        </span>
                        {s.repo_url && (
                          <a
                            href={s.repo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="View repo"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {data.students.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No students enrolled in this course.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
