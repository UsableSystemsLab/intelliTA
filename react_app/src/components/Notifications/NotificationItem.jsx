import { Award, Coins, Gift } from "lucide-react";
import { timeAgo } from "@/utils/timeAgo";

const TYPE_ICON = {
  POINTS_EARNED: Coins,
  BADGE_EARNED: Award,
  INSTRUCTOR_AWARD: Gift,
};

export default function NotificationItem({ item, onRead }) {
  const Icon = TYPE_ICON[item.type] || Gift;
  const unread = !item.is_read;

  return (
    <button
      type="button"
      onClick={() => unread && onRead(item.id)}
      className={`w-full text-left px-4 py-3 flex gap-3 transition-colors border-b border-gray-800/70 last:border-b-0
        ${unread ? "bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer" : "hover:bg-gray-800/60 cursor-default"}`}
    >
      <div
        className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0
          ${unread ? "bg-blue-500/20 text-blue-400" : "bg-gray-800 text-gray-500"}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className={`text-sm font-medium truncate ${unread ? "text-white" : "text-gray-400"}`}>
            {item.title}
          </p>
          {unread && <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
        </div>
        {item.body && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.body}</p>
        )}
        <p className="text-[11px] text-gray-500 mt-1">{timeAgo(item.created_at)}</p>
      </div>
    </button>
  );
}
