import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Trophy, Crown, Medal, BookOpen } from "lucide-react";
import { API_BASE, getAuthHeaders } from "@/config/api";
import { auth } from "@/utils/firebase.js";
import { getCourseLeaderboard } from "@/config/gamificationApi";
import Breadcrumb from "@/components/shared/Breadcrumb";

function Avatar({ name, photoUrl }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className="w-10 h-10 rounded-full object-cover border border-gray-700"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-200">
      {initials || "?"}
    </div>
  );
}

function RankBadge({ rank }) {
  if (rank === 1)
    return <Crown className="w-6 h-6 text-yellow-400" aria-hidden />;
  if (rank === 2)
    return <Medal className="w-6 h-6 text-gray-300" aria-hidden />;
  if (rank === 3)
    return <Medal className="w-6 h-6 text-amber-600" aria-hidden />;
  return (
    <span className="w-6 text-center text-sm font-semibold text-gray-500">
      {rank}
    </span>
  );
}

export default function Maincontent({ user }) {
  const { t } = useTranslation();

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  const [board, setBoard] = useState(null);
  const [boardLoading, setBoardLoading] = useState(false);
  const [error, setError] = useState(null);

  const meRef = useRef(null);

  // Load the courses this user is enrolled in / teaches (same call the
  // Courses page uses) to populate the course picker.
  useEffect(() => {
    async function loadCourses() {
      try {
        let url = `${API_BASE}/courses`;
        if (user && user.uid && user.role !== "admin") {
          url += `?firebaseId=${user.uid}`;
        }
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...(await getAuthHeaders(auth.currentUser)),
          },
        });
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setCourses(list);
        if (list.length > 0) setSelectedCourseId(list[0].course_id);
      } catch (err) {
        console.error("Error loading courses:", err);
        setError(err.message);
      } finally {
        setCoursesLoading(false);
      }
    }
    loadCourses();
  }, [user]);

  // Load the leaderboard for the selected course.
  useEffect(() => {
    if (!selectedCourseId) return;
    let cancelled = false;
    async function loadBoard() {
      setBoardLoading(true);
      setError(null);
      try {
        const data = await getCourseLeaderboard(
          auth.currentUser,
          selectedCourseId,
          user?.uid,
        );
        if (!cancelled) setBoard(data);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setBoard(null);
        }
      } finally {
        if (!cancelled) setBoardLoading(false);
      }
    }
    loadBoard();
    return () => {
      cancelled = true;
    };
  }, [selectedCourseId, user]);

  // Bring the current user's row into view once the board is rendered.
  useEffect(() => {
    if (board && meRef.current) {
      meRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [board]);

  const rows = board?.rows || [];

  return (
    <main className="relative bg-gray-900 min-h-screen w-full overflow-y-auto">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-gray-800">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <div className="mb-4">
            <Breadcrumb
              items={[{ label: t("leaderboard", { defaultValue: "Leaderboard" }) }]}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 rounded-xl">
              <Trophy className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {t("leaderboard", { defaultValue: "Leaderboard" })}
              </h1>
              <p className="text-gray-400">
                {t("leaderboardSubtitle", {
                  defaultValue: "Top students by points earned in this course",
                })}
              </p>
            </div>
          </div>

          {/* Course picker */}
          {!coursesLoading && courses.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {courses.map((c) => {
                const active = c.course_id === selectedCourseId;
                return (
                  <button
                    key={c.course_id}
                    type="button"
                    onClick={() => setSelectedCourseId(c.course_id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                      active
                        ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25"
                        : "bg-gray-800/60 text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    {c.course_code || c.title}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {coursesLoading && (
          <p className="text-white text-lg">
            {t("loading", { defaultValue: "Loading..." })}
          </p>
        )}

        {!coursesLoading && courses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 border border-gray-700">
              <BookOpen className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {t("noCoursesYet", { defaultValue: "No courses yet" })}
            </h3>
            <p className="text-gray-500 text-center max-w-md">
              {t("leaderboardNoCourses", {
                defaultValue:
                  "Join a course to see how you rank against your classmates.",
              })}
            </p>
          </div>
        )}

        {!coursesLoading && courses.length > 0 && (
          <>
            {error && (
              <div className="mb-6 w-fit px-4 py-2 rounded-lg text-white bg-red-500">
                {error}
              </div>
            )}

            {boardLoading && (
              <p className="text-white text-lg">
                {t("loading", { defaultValue: "Loading..." })}
              </p>
            )}

            {!boardLoading && !error && rows.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 border border-gray-700">
                  <Trophy className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  {t("leaderboardEmpty", {
                    defaultValue: "Nothing here yet",
                  })}
                </h3>
                <p className="text-gray-500 text-center max-w-md">
                  {t("leaderboardEmptyHint", {
                    defaultValue:
                      "No students have earned points in this course yet.",
                  })}
                </p>
              </div>
            )}

            {!boardLoading && !error && rows.length > 0 && (
              <div className="flex flex-col gap-2">
                {rows.map((r) => (
                  <div
                    key={r.user_id}
                    ref={r.is_me ? meRef : null}
                    className={`flex items-center gap-4 px-4 sm:px-5 py-3 rounded-xl border transition-all duration-200 ${
                      r.is_me
                        ? "bg-blue-600/10 border-blue-500/60 ring-1 ring-blue-500/40"
                        : r.rank <= 3
                          ? "bg-gray-800/80 border-gray-700"
                          : "bg-gray-800/40 border-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-center w-7 shrink-0">
                      <RankBadge rank={r.rank} />
                    </div>
                    <Avatar name={r.name} photoUrl={r.photo_url} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {r.name}
                        {r.is_me && (
                          <span className="ml-2 text-xs font-semibold text-blue-400">
                            {t("you", { defaultValue: "You" })}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-lg font-bold text-white">
                        {r.points}
                      </span>
                      <span className="ml-1 text-xs text-gray-400">
                        {t("points", { defaultValue: "pts" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
