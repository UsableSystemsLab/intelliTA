import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Loader, Calendar as CalendarIcon } from "lucide-react";
import Nav from "@/components/Landing-page/Nav";
import Sidebar from "@/components/Courses/Sidebar";
import Footer from "@/components/shared/Footer";
import MonthGrid, { courseColor } from "@/components/Calendar/MonthGrid";
import { API_BASE, getAuthHeaders } from "@/config/api";
import { auth } from "@/utils/firebase.js";

const getActivityStatus = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (now < start) return "upcoming";
  if (now > end) return "end";
  return "active";
};

export default function Calendar({ user }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "ar" ? "ar" : "en";
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);

  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const headers = await getAuthHeaders(auth.currentUser);

        const url =
          user.role === "admin"
            ? `${API_BASE}/courses`
            : `${API_BASE}/courses?firebaseId=${user.uid}`;
        const coursesRes = await fetch(url, { headers });
        const coursesData = coursesRes.ok ? await coursesRes.json() : [];
        const courseList = Array.isArray(coursesData) ? coursesData : [];

        const passedSet = new Set();
        if (user.id) {
          const passedRes = await fetch(
            `${API_BASE}/users/${user.id}/passed-activities`,
            { headers },
          );
          if (passedRes.ok) {
            const data = await passedRes.json();
            (data.activity_ids || []).forEach((id) => passedSet.add(id));
          }
        }

        const perCourse = await Promise.all(
          courseList.map(async (c) => {
            const res = await fetch(`${API_BASE}/courses/${c.course_id}/activities`, {
              headers,
            });
            if (!res.ok) return [];
            const acts = await res.json();
            return (Array.isArray(acts) ? acts : []).map((a) => ({
              courseId: c.course_id,
              courseName: c.name || c.title || `#${c.course_id}`,
              activityId: a.activity_id,
              title: a.title,
              start_date: a.start_date,
              end_date: a.end_date,
              status: passedSet.has(a.activity_id)
                ? "solved"
                : getActivityStatus(a.start_date, a.end_date),
            }));
          }),
        );

        if (cancelled) return;
        setCourses(courseList);
        setEvents(perCourse.flat());
      } catch (err) {
        console.error("Calendar load failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.id, user?.role]);

  const monthLabel = useMemo(() => {
    const d = new Date(cursor.year, cursor.month, 1);
    return d.toLocaleDateString(locale, { month: "long", year: "numeric" });
  }, [cursor, locale]);

  const prevMonth = () =>
    setCursor((c) => {
      const d = new Date(c.year, c.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  const nextMonth = () =>
    setCursor((c) => {
      const d = new Date(c.year, c.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  const goToday = () =>
    setCursor({ year: today.getFullYear(), month: today.getMonth() });

  return (
    <>
      <Nav user={user} />
      <div className="flex relative overflow-hidden bg-transparent min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 px-4 md:px-8 py-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-6 h-6 text-blue-400" />
                <h1 className="text-2xl font-bold text-gray-100">{t("calendar")}</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-3 py-1.5 min-w-[180px] text-center font-semibold text-gray-200">
                  {monthLabel}
                </div>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={goToday}
                  className="ml-2 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm"
                >
                  {t("calendarToday")}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              <>
                <MonthGrid year={cursor.year} month={cursor.month} events={events} />

                {courses.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {courses.map((c) => {
                      const col = courseColor(c.course_id);
                      return (
                        <span
                          key={c.course_id}
                          className={`${col.bg} ${col.border} ${col.text}
                            border rounded-full px-2.5 py-1 text-xs`}
                        >
                          {c.name || c.title || `#${c.course_id}`}
                        </span>
                      );
                    })}
                  </div>
                )}

                {events.length === 0 && (
                  <div className="mt-6 text-center text-gray-500 text-sm">
                    {t("calendarNoEvents")}
                  </div>
                )}
              </>
            )}
          </div>
          <Footer />
        </div>
      </div>
    </>
  );
}
