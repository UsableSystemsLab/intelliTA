import { useState } from "react";
import { Bug, X, Loader2, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { API_BASE, getAuthHeaders } from "@/config/api";
import { auth } from "@/utils/firebase";
import { awardBugHunter } from "@/config/gamificationApi";

// Instructor-only: award the Bug Hunter badge to a student. The backend
// enforces the instructor role (403 otherwise) and rejects duplicates (409).
export default function AwardBugHunterButton({ userId, studentName, courseId }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [activityId, setActivityId] = useState("");
  const [activities, setActivities] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // {type:'success'|'error', msg}

  const openModal = async () => {
    setOpen(true);
    setStatus(null);
    try {
      const res = await fetch(`${API_BASE}/courses/${courseId}/activities`, {
        headers: await getAuthHeaders(auth.currentUser),
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(Array.isArray(data) ? data : data.activities || []);
      }
    } catch {
      /* dropdown stays empty — activity is optional anyway */
    }
  };

  const close = () => {
    setOpen(false);
    setReason("");
    setActivityId("");
    setStatus(null);
  };

  const submit = async () => {
    setSubmitting(true);
    setStatus(null);
    try {
      await awardBugHunter(auth.currentUser, {
        user_id: userId,
        activity_id: activityId ? Number(activityId) : undefined,
        reason: reason.trim() || undefined,
      });
      setStatus({
        type: "success",
        msg: t("bugHunter.success", { defaultValue: "Bug Hunter badge awarded!" }),
      });
    } catch (err) {
      const msg =
        err.status === 409
          ? t("bugHunter.duplicate", {
              defaultValue: "This student already has the Bug Hunter badge.",
            })
          : err.status === 403
            ? t("bugHunter.forbidden", {
                defaultValue: "Only instructors can award this badge.",
              })
            : t("bugHunter.error", { defaultValue: "Couldn't award the badge." });
      setStatus({ type: "error", msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="flex-shrink-0 p-2 text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all duration-200"
        title={t("bugHunter.award", { defaultValue: "Award Bug Hunter" })}
      >
        <Bug size={18} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Bug className="w-4 h-4 text-amber-400" />
                {t("bugHunter.title", { defaultValue: "Award Bug Hunter" })}
              </h3>
              <button
                type="button"
                onClick={close}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <p className="text-sm text-gray-400">
                {t("bugHunter.subtitle", {
                  defaultValue: "Awarding to {{name}}.",
                  name: studentName,
                })}
              </p>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  {t("bugHunter.activity", { defaultValue: "Related activity (optional)" })}
                </label>
                <select
                  value={activityId}
                  onChange={(e) => setActivityId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">— {t("bugHunter.none", { defaultValue: "None" })} —</option>
                  {activities.map((a) => (
                    <option key={a.activity_id} value={a.activity_id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  {t("bugHunter.reason", { defaultValue: "Reason (optional)" })}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder={t("bugHunter.reasonPlaceholder", {
                    defaultValue: "Found a critical edge-case bug…",
                  })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {status && (
                <p
                  className={`text-sm flex items-center gap-1.5 ${
                    status.type === "success" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {status.type === "success" && <Check className="w-4 h-4" />}
                  {status.msg}
                </p>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-700 flex gap-3">
              <button
                type="button"
                onClick={close}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors"
              >
                {status?.type === "success"
                  ? t("common.close", { defaultValue: "Close" })
                  : t("common.cancel", { defaultValue: "Cancel" })}
              </button>
              {status?.type !== "success" && (
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-white rounded-lg bg-amber-600 hover:bg-amber-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t("bugHunter.confirm", { defaultValue: "Award badge" })
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
