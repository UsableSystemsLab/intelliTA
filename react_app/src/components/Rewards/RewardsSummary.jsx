import { useState, useEffect } from "react";
import { Loader2, Coins, CheckCircle2, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { auth } from "@/utils/firebase";
import { getRewardsSummary } from "@/config/gamificationApi";

function Stat({ icon: Icon, value, label, accent }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

export default function RewardsSummary({ userId }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setLoading(true);
    setError(false);
    getRewardsSummary(auth.currentUser, userId)
      .then((d) => active && setData(d))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-10 bg-gray-900/60 border border-gray-800 rounded-2xl">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="p-6 bg-gray-900/60 border border-gray-800 rounded-2xl text-sm text-gray-500">
        {t("rewards.summaryError", { defaultValue: "Couldn't load your rewards summary." })}
      </div>
    );
  }

  const earned = data.badges_earned_count ?? 0;
  const total = data.badges_total_count ?? 0;
  const instances = data.badges_instances_count ?? earned;
  const pct = total > 0 ? Math.round((earned / total) * 100) : 0;

  return (
    <div className="p-6 bg-gray-900/60 border border-gray-800 rounded-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Stat
          icon={Coins}
          value={data.total_points ?? 0}
          label={t("rewards.totalPoints", { defaultValue: "Total points" })}
          accent="bg-blue-500/20 text-blue-400"
        />
        <Stat
          icon={CheckCircle2}
          value={data.completed_activities ?? 0}
          label={t("rewards.completedActivities", { defaultValue: "Completed activities" })}
          accent="bg-green-500/20 text-green-400"
        />
        <Stat
          icon={Trophy}
          value={`${earned} / ${total}`}
          label={t("rewards.badgeTypes", { defaultValue: "Badge types" })}
          accent="bg-yellow-500/20 text-yellow-400"
        />
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>{t("rewards.badgeProgress", { defaultValue: "Badge progress" })}</span>
          <span>
            {pct}% ·{" "}
            {t("rewards.instancesEarned", {
              defaultValue: "{{n}} earned",
              n: instances,
            })}
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
