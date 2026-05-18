import { Award, Lock } from "lucide-react";
import { tierClasses } from "@/components/Rewards/rewardsMeta";

// One badge tile. `locked` renders it grayscale with a hover tooltip
// describing how to earn it. For earned badges, `count`/`labs` describe
// how many times it was earned and in which labs (repeatable badges).
export default function BadgeCard({ badge, locked, count = 1, labs = [] }) {
  const tc = tierClasses(badge.tier);

  return (
    <div className="group relative flex flex-col items-center gap-2 text-center">
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center border bg-gray-800/60
          ${locked ? "border-gray-800 grayscale opacity-50" : `${tc.ring} shadow-lg ${tc.glow}`}`}
      >
        {badge.icon_url ? (
          <img src={badge.icon_url} alt="" className="w-9 h-9" />
        ) : (
          <Award className={`w-9 h-9 ${locked ? "text-gray-600" : tc.text}`} />
        )}
        {locked && (
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center">
            <Lock className="w-3 h-3 text-gray-500" />
          </span>
        )}
        {!locked && (
          <span
            className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full
              text-[11px] font-bold flex items-center justify-center
              border border-gray-900 ${tc.text} bg-gray-900`}
          >
            ·{count}
          </span>
        )}
      </div>
      <span className={`text-xs font-medium ${locked ? "text-gray-500" : "text-gray-200"}`}>
        {badge.name}
      </span>

      {(badge.description || badge.activity_title || labs.length > 0) && (
        <div
          className="pointer-events-none absolute bottom-full mb-2 z-10 w-44 px-3 py-2 rounded-lg
                     bg-gray-950 border border-gray-700 text-[11px] text-gray-300 leading-snug
                     opacity-0 group-hover:opacity-100 transition-opacity shadow-xl"
        >
          {locked
            ? badge.description
            : labs.length > 0
              ? `Earned in: ${labs.join(", ")}`
              : badge.activity_title
                ? `Earned in ${badge.activity_title}`
                : badge.description}
        </div>
      )}
    </div>
  );
}
