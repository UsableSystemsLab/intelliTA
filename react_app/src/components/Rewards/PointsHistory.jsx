import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { auth } from "@/utils/firebase";
import { getRewardsHistory } from "@/config/gamificationApi";
import { eventLabel } from "@/components/Rewards/rewardsMeta";
import { timeAgo } from "@/utils/timeAgo";

const PAGE = 20;

export default function PointsHistory({ userId }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(
    async (nextCursor) => {
      const first = !nextCursor;
      first ? setLoading(true) : setLoadingMore(true);
      try {
        const data = await getRewardsHistory(auth.currentUser, userId, {
          limit: PAGE,
          cursor: nextCursor,
        });
        setItems((prev) => (first ? data.items || [] : [...prev, ...(data.items || [])]));
        setCursor(data.next_cursor || null);
      } catch {
        setError(true);
      } finally {
        first ? setLoading(false) : setLoadingMore(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    if (!userId) return;
    setError(false);
    load(null);
  }, [userId, load]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }
  if (error && items.length === 0) {
    return (
      <p className="text-center text-sm text-gray-500 py-10">
        {t("rewards.historyError", { defaultValue: "Couldn't load points history." })}
      </p>
    );
  }
  if (items.length === 0) {
    return (
      <p className="text-center text-sm text-gray-500 py-10">
        {t("rewards.noHistory", { defaultValue: "No points activity yet." })}
      </p>
    );
  }

  return (
    <div>
      <div className="divide-y divide-gray-800/70">
        {items.map((it) => (
          <div key={it.ledger_id} className="flex items-center justify-between py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-800 text-gray-300">
                  {eventLabel(it.event_type)}
                </span>
                {it.activity_id && (
                  <span className="text-xs text-gray-500 truncate">
                    {t("rewards.inActivity", {
                      defaultValue: "in activity {{id}}",
                      id: it.activity_id,
                    })}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">{timeAgo(it.created_at)}</p>
            </div>
            <span
              className={`text-sm font-semibold shrink-0 ${
                it.points < 0 ? "text-red-400" : "text-green-400"
              }`}
            >
              {it.points > 0 ? "+" : ""}
              {it.points}
            </span>
          </div>
        ))}
      </div>

      {cursor && (
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={() => load(cursor)}
            disabled={loadingMore}
            className="px-4 py-2 text-sm font-medium text-gray-300 rounded-lg border border-gray-700
                       hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            {loadingMore
              ? t("common.loading", { defaultValue: "Loading…" })
              : t("rewards.loadMore", { defaultValue: "Load more" })}
          </button>
        </div>
      )}
    </div>
  );
}
