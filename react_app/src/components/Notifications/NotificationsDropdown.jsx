import { Loader2, BellOff, CheckCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import NotificationItem from "@/components/Notifications/NotificationItem";

export default function NotificationsDropdown({
  items,
  loading,
  error,
  hasUnread,
  onItemRead,
  onMarkAll,
  isArabic,
}) {
  const { t } = useTranslation();

  return (
    <div
      className={`absolute ${isArabic ? "left-0" : "right-0"} mt-2 z-20 w-80
        bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-2xl overflow-hidden`}
    >
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">
          {t("notifications.title", { defaultValue: "Notifications" })}
        </p>
        {hasUnread && (
          <button
            type="button"
            onClick={onMarkAll}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            {t("notifications.markAll", { defaultValue: "Mark all read" })}
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : error ? (
          <p className="px-4 py-10 text-center text-sm text-gray-500">
            {t("notifications.error", { defaultValue: "Couldn't load notifications." })}
          </p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-gray-500">
            <BellOff className="w-6 h-6" />
            <p className="text-sm">
              {t("notifications.empty", { defaultValue: "You're all caught up" })}
            </p>
          </div>
        ) : (
          items.map((item) => (
            <NotificationItem key={item.id} item={item} onRead={onItemRead} />
          ))
        )}
      </div>
    </div>
  );
}
