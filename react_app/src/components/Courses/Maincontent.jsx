import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Card from "./CoursesCard";
import Breadcrumb from "../shared/Breadcrumb";
import { ChevronLeft, ChevronRight, BookOpen, Plus } from "lucide-react";
import { API_BASE } from "../../config/api";

export default function Maincontent({ user }) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 6;

  // Join course state
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [availableNames, setAvailableNames] = useState([]);
  const [selectedName, setSelectedName] = useState("");

  // Fetch courses from API
  useEffect(() => {
    async function loadCourses() {
      try {
        let url = `${API_BASE}/courses`;
        if (user && user.uid && user.role !== "admin") {
          url += `?firebaseId=${user.uid}`;
        }

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer 1111",
          },
        });

        const data = await response.json();
        if (Array.isArray(data)) {
          setCourses(data);
        } else {
          setCourses([]);
        }
      } catch (err) {
        console.error("Error loading courses:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, [user]);

  // Pagination Calculations
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = courses.slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil(courses.length / coursesPerPage);

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  // Join logic
  const handleJoinCourse = async (nameToUse = null) => {
    if (!joinCode.trim()) return;
    setJoinLoading(true);
    setJoinMessage(null);

    const performJoin = () => fetch(`${API_BASE}/courses/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer 1111"
      },
      body: JSON.stringify({
        token: joinCode,
        firebaseId: user?.uid,
        selected_name: nameToUse
      })
    });

    try {
      let response = await performJoin();
      let data = await response.json();

      if (response.status === 404 && data.message === "User not found") {
        const createUserRes = await fetch(`${API_BASE}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer 1111" },
          body: JSON.stringify({
            firebaseId: user?.uid,
            first_name: user?.firstName || user?.displayName?.split(' ')[0] || "Unknown",
            last_name: user?.lastName || user?.displayName?.split(' ').slice(1).join(' ') || "User",
            email: user?.email
          })
        });

        if (createUserRes.ok) {
          response = await performJoin();
          data = await response.json();
        }
      }

      if (response.status === 403 && data.requires_name_selection) {
        setAvailableNames(data.available_names);
        setShowNameModal(true);
        setJoinLoading(false);
        return;
      }

      if (response.ok) {
        setJoinMessage({ type: 'success', text: 'Joined successfully!' });
        setShowNameModal(false);
        window.location.reload();
      } else {
        setJoinMessage({ type: 'error', text: data.message || 'Failed to join' });
      }
    } catch (err) {
      setJoinMessage({ type: 'error', text: err.message });
    } finally {
      if (!showNameModal) setJoinLoading(false);
    }
  };

  const submitNameSelection = () => {
    if (!selectedName) return;
    handleJoinCourse(selectedName);
  };

  return (
    <main className="relative bg-gray-900 min-h-screen w-full overflow-y-auto">
      {/* Name Selection Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-md w-full shadow-2xl text-white">
            <button onClick={() => setShowNameModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">✕</button>
            <h3 className="text-2xl font-bold mb-4">Select Your Name</h3>
            <p className="text-gray-400 mb-6">Identify yourself from the list below:</p>
            <select
              className="w-full p-3 mb-6 bg-gray-900/50 border border-gray-700 rounded-xl text-white"
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value)}
            >
              <option value="">-- Select Name --</option>
              {availableNames.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <button onClick={submitNameSelection} disabled={joinLoading || !selectedName} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium disabled:opacity-50 transition-colors">
              {joinLoading ? "Joining..." : "Confirm & Join"}
            </button>
          </div>
        </div>
      )}

      {/* Hero Header Section */}
      <div className="relative overflow-hidden border-b border-gray-800">
        {/* Background decoration */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
          <div className="mb-4">
            <Breadcrumb items={[{ label: "Courses" }]} />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Courses
              </h1>
              <p className="text-gray-400 text-lg">
                {loading ? "Loading..." : `${courses.length} ${courses.length === 1 ? 'course' : 'courses'} available`}
              </p>
            </div>

           
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-800/50 p-2 rounded-xl backdrop-blur-sm border border-gray-700">
                <input
                  type="text"
                  placeholder="Enter Token"
                  className="bg-transparent text-white px-3 py-2 outline-none w-40 sm:w-56 placeholder-gray-500"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
                <button
                  onClick={() => handleJoinCourse()}
                  disabled={joinLoading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                  {joinLoading ? "Joining..." : "Join"}
                </button>
              </div>
              {!loading && courses.length > 0 && (
                <Link
                  to="/courses/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                >
                  <Plus className="w-5 h-5" />
                  Create Course
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Join Message */}
      {joinMessage && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className={`w-fit px-4 py-2 rounded-lg text-white ${joinMessage.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
            {joinMessage.text}
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && <p className="text-white text-xl col-span-full">Loading courses...</p>}
          {!loading && courses.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-6">
              <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 border border-gray-700">
                <BookOpen className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No courses yet</h3>
              <p className="text-gray-500 text-center max-w-md mb-6">
                Create your first course to get started, or join an existing one using a token.
              </p>
              <Link
                to="/courses/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                <Plus className="w-5 h-5" />
                Create First Course
              </Link>
            </div>
          )}
          {!loading && currentCourses.map((course) => (
            <Card
              key={course.course_id}
              id={course.course_id}
              code={course.course_code}
              title={course.title}
              description={course.description}
              status={false}
            />
          ))}
        </div>

        {/* Pagination Controls */}
        {!loading && courses.length > coursesPerPage && (
          <div className="flex justify-center items-center gap-6 mt-12">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`p-3 rounded-full transition-all duration-200 ${currentPage === 1 ? 'text-gray-600 cursor-not-allowed' : 'text-white bg-gray-800 hover:bg-blue-600 hover:shadow-lg'}`}
            >
              <ChevronLeft className={`w-6 h-6 ${isArabic ? 'rotate-180' : ''}`} />
            </button>
            <span className="text-gray-400 font-medium">
              Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span>
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`p-3 rounded-full transition-all duration-200 ${currentPage === totalPages ? 'text-gray-600 cursor-not-allowed' : 'text-white bg-gray-800 hover:bg-blue-600 hover:shadow-lg'}`}
            >
              <ChevronRight className={`w-6 h-6 ${isArabic ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}