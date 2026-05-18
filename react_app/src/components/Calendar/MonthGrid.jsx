import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Clock, PlayCircle, XCircle, Play } from "lucide-react";

const COURSE_PALETTE = [
  { bg: "bg-blue-500/15", border: "border-blue-500/50", text: "text-blue-300", btn: "bg-blue-500 hover:bg-blue-400" },
  { bg: "bg-emerald-500/15", border: "border-emerald-500/50", text: "text-emerald-300", btn: "bg-emerald-500 hover:bg-emerald-400" },
  { bg: "bg-purple-500/15", border: "border-purple-500/50", text: "text-purple-300", btn: "bg-purple-500 hover:bg-purple-400" },
  { bg: "bg-amber-500/15", border: "border-amber-500/50", text: "text-amber-300", btn: "bg-amber-500 hover:bg-amber-400" },
  { bg: "bg-pink-500/15", border: "border-pink-500/50", text: "text-pink-300", btn: "bg-pink-500 hover:bg-pink-400" },
  { bg: "bg-cyan-500/15", border: "border-cyan-500/50", text: "text-cyan-300", btn: "bg-cyan-500 hover:bg-cyan-400" },
  { bg: "bg-orange-500/15", border: "border-orange-500/50", text: "text-orange-300", btn: "bg-orange-500 hover:bg-orange-400" },
  { bg: "bg-teal-500/15", border: "border-teal-500/50", text: "text-teal-300", btn: "bg-teal-500 hover:bg-teal-400" },
];

export function courseColor(courseId) {
  const idx = Math.abs(Number(courseId) || 0) % COURSE_PALETTE.length;
  return COURSE_PALETTE[idx];
}

const STATUS_META = {
  solved: { Icon: CheckCircle2, cls: "text-emerald-400", labelKey: "statusSolved" },
  upcoming: { Icon: Clock, cls: "text-amber-400", labelKey: "statusUpcoming" },
  active: { Icon: PlayCircle, cls: "text-blue-400", labelKey: "statusActive" },
  end: { Icon: XCircle, cls: "text-gray-500", labelKey: "statusEnded" },
};

const MS_DAY = 86400000;

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const pad = (n) => String(n).padStart(2, "0");

function formatCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// EventBox: mini card with title, days-left or live timer, status, Start button.
function EventBox({ event, cellDate, now, t }) {
  const navigate = useNavigate();
  const c = courseColor(event.courseId);
  const meta = STATUS_META[event.status] || STATUS_META.upcoming;
  const StatusIcon = meta.Icon;

  const start = new Date(event.start_date);
  const end = new Date(event.end_date);
  const today = startOfDay(now);
  const isToday = sameDay(cellDate, today);

  // Live timer: when this cell is today AND activity is currently active (now within [start,end]).
  const showTimer = isToday && now >= start && now <= end;

  let infoLabel = "";
  if (event.status === "solved") {
    infoLabel = t("statusSolved");
  } else if (showTimer) {
    infoLabel = formatCountdown(end - now);
  } else if (event.status === "upcoming") {
    const days = Math.ceil((startOfDay(start) - today) / MS_DAY);
    infoLabel = days <= 0 ? t("calendarStartsToday") : t("calendarDaysLeft", { count: days });
  } else if (event.status === "active") {
    const days = Math.ceil((startOfDay(end) - today) / MS_DAY);
    infoLabel = days <= 0 ? t("calendarEndsToday") : t("calendarDaysToEnd", { count: days });
  } else if (event.status === "end") {
    const days = Math.floor((today - startOfDay(end)) / MS_DAY);
    infoLabel = t("calendarEndedDaysAgo", { count: days });
  }

  const canStart = event.status === "active" || event.status === "upcoming";
  const dim = event.status === "end" ? "opacity-60" : "";

  return (
    <div
      className={`${c.bg} ${c.border} ${dim}
        border rounded-md p-1.5 flex flex-col gap-1 min-w-0`}
      title={`${event.courseName} — ${event.title}`}
    >
      <div className={`text-[11px] font-semibold ${c.text} truncate leading-tight`}>
        {event.title}
      </div>
      <div className="flex items-center gap-1 text-[10px] text-gray-300">
        <StatusIcon className={`w-3 h-3 shrink-0 ${meta.cls}`} />
        <span className={showTimer ? "font-mono tabular-nums" : "truncate"}>{infoLabel}</span>
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className={`text-[9px] uppercase tracking-wide ${meta.cls}`}>
          {t(meta.labelKey)}
        </span>
        <button
          type="button"
          disabled={event.status === "end"}
          onClick={() =>
            navigate(`/courses/${event.courseId}/activities/${event.activityId}`)
          }
          className={`text-[10px] px-1.5 py-0.5 rounded text-white flex items-center gap-0.5
            ${event.status === "end" ? "bg-gray-700 cursor-not-allowed" : c.btn}`}
        >
          <Play className="w-2.5 h-2.5" />
          {event.status === "solved"
            ? t("calendarReview")
            : canStart
              ? t("calendarStart")
              : t("calendarOpen")}
        </button>
      </div>
    </div>
  );
}

export default function MonthGrid({ year, month, events }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "ar" ? "ar" : "en";
  const [now, setNow] = useState(() => new Date());

  // Tick every second only if any event is currently live (within start/end of any cell == today).
  const hasLiveToday = useMemo(() => {
    const n = new Date();
    return events.some(
      (e) => n >= new Date(e.start_date) && n <= new Date(e.end_date),
    );
  }, [events]);

  useEffect(() => {
    if (!hasLiveToday) return undefined;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [hasLiveToday]);

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay();
    const gridStart = new Date(year, month, 1 - startWeekday);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [year, month]);

  const weekdayNames = useMemo(() => {
    const base = new Date(2024, 0, 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(locale, { weekday: "short" });
    });
  }, [locale]);

  const today = startOfDay(now);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const e of events) {
      const s = startOfDay(e.start_date);
      const en = startOfDay(e.end_date);
      for (const d of cells) {
        if (d >= s && d <= en) {
          const key = d.toDateString();
          if (!map.has(key)) map.set(key, []);
          map.get(key).push(e);
        }
      }
    }
    return map;
  }, [events, cells]);

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-800 bg-gray-900/80">
        {weekdayNames.map((w) => (
          <div key={w} className="px-2 py-2 text-center text-xs font-semibold text-gray-400 uppercase">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, idx) => {
          const inMonth = d.getMonth() === month;
          const isToday = sameDay(d, today);
          const dayEvents = eventsByDay.get(d.toDateString()) || [];
          return (
            <div
              key={idx}
              className={`min-h-[160px] border-b border-r border-gray-800 p-1.5 flex flex-col gap-1.5 ${
                inMonth ? "bg-gray-900/40" : "bg-gray-950/60"
              }`}
            >
              <div
                className={`text-xs font-medium ${
                  isToday
                    ? "self-start px-1.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    : inMonth
                      ? "text-gray-300"
                      : "text-gray-600"
                }`}
              >
                {d.getDate()}
              </div>
              <div className="flex flex-col gap-1.5 overflow-hidden">
                {dayEvents.slice(0, 2).map((e) => (
                  <EventBox
                    key={`${e.courseId}-${e.activityId}`}
                    event={e}
                    cellDate={d}
                    now={now}
                    t={t}
                  />
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[10px] text-gray-500 px-1">
                    +{dayEvents.length - 2}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
