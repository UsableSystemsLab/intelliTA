import { useState, useEffect } from "react";
import { Loader2, Award } from "lucide-react";
import { useTranslation } from "react-i18next";
import { auth } from "@/utils/firebase";
import { getBadges } from "@/config/gamificationApi";
import BadgeCard from "@/components/Rewards/BadgeCard";

// Self-contained badges panel. Takes an explicit `userId` so it works
// both for the caller's dashboard and another student's public profile.
export default function BadgesGrid({ userId }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setLoading(true);
    setError(false);
    getBadges(auth.currentUser, userId)
      .then((d) => active && setData(d))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <p className="text-center text-sm text-gray-500 py-12">
        {t("rewards.badgesError", { defaultValue: "Couldn't load badges." })}
      </p>
    );
  }

  const earned = data?.earned || [];
  const locked = data?.locked || [];

  // Group repeatable badges by type: one card per badge code, carrying a
  // count and the list of labs that earned it.
  const earnedGroups = [];
  const byCode = new Map();
  for (const b of earned) {
    let g = byCode.get(b.code);
    if (!g) {
      g = { ...b, count: 0, labs: [] };
      byCode.set(b.code, g);
      earnedGroups.push(g);
    }
    g.count += 1;
    if (b.activity_title) g.labs.push(b.activity_title);
  }

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-yellow-400" />
          {t("rewards.earnedBadges", { defaultValue: "Earned" })}
          <span className="text-gray-500 font-normal">
            ({t("rewards.badgeTallies", {
              defaultValue: "{{types}} types · {{total}} total",
              types: earnedGroups.length,
              total: earned.length,
            })})
          </span>
        </h3>
        {earnedGroups.length === 0 ? (
          <p className="text-sm text-gray-500">
            {t("rewards.noBadgesYet", { defaultValue: "No badges earned yet — keep going!" })}
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-5">
            {earnedGroups.map((g) => (
              <BadgeCard key={g.code} badge={g} count={g.count} labs={g.labs} />
            ))}
          </div>
        )}
      </section>

      {locked.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-400 mb-4">
            {t("rewards.lockedBadges", { defaultValue: "Locked" })}
            <span className="text-gray-600 font-normal"> ({locked.length})</span>
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-5">
            {locked.map((b) => (
              <BadgeCard key={b.code} badge={b} locked />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
