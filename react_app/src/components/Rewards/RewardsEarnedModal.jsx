import { Link } from "react-router-dom";
import { X, Sparkles, Award } from "lucide-react";
import { useTranslation } from "react-i18next";
import { eventLabel, tierClasses } from "@/components/Rewards/rewardsMeta";

// Shown after a gamified submission when points were earned.
// `rewards` shape: { points_earned, lines:[{event_type, points}],
// badges_awarded:[{code,name,icon_url,tier}], notifications:[...] }
export default function RewardsEarnedModal({ rewards, onClose }) {
  const { t } = useTranslation();
  if (!rewards) return null;

  const lines = rewards.lines || [];
  const badges = rewards.badges_awarded || [];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-6 pt-8 pb-6 text-center bg-gradient-to-b from-blue-600/20 to-transparent">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer"
            aria-label={t("common.close", { defaultValue: "Close" })}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-3">
            <Sparkles className="w-7 h-7 text-blue-400" />
          </div>
          <p className="text-4xl font-extrabold text-white">
            +{rewards.points_earned}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {t("rewards.pointsEarned", { defaultValue: "points earned" })}
          </p>
        </div>

        {lines.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-800 space-y-2">
            {lines.map((ln, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{eventLabel(ln.event_type)}</span>
                <span
                  className={`font-semibold ${ln.points < 0 ? "text-red-400" : "text-green-400"}`}
                >
                  {ln.points > 0 ? "+" : ""}
                  {ln.points}
                </span>
              </div>
            ))}
          </div>
        )}

        {badges.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-800">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">
              {t("rewards.newBadges", { defaultValue: "New badges" })}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {badges.map((b) => {
                const tc = tierClasses(b.tier);
                return (
                  <div
                    key={b.code}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border ${tc.ring} bg-gray-800/50`}
                  >
                    {b.icon_url ? (
                      <img src={b.icon_url} alt="" className="w-8 h-8" />
                    ) : (
                      <Award className={`w-8 h-8 ${tc.text}`} />
                    )}
                    <span className="text-[11px] text-center text-gray-300 leading-tight">
                      {b.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 rounded-lg
                       border border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer"
          >
            {t("common.dismiss", { defaultValue: "Dismiss" })}
          </button>
          <Link
            to="/rewards/me"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white text-center rounded-lg
                       bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            {t("rewards.viewAll", { defaultValue: "View all" })}
          </Link>
        </div>
      </div>
    </div>
  );
}
