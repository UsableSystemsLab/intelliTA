import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Card from "./CoursesCard";
import { ChevronLeft, ChevronRight, Loader } from "lucide-react";

export default function Maincontent({ user }) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);


  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 6;

  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [availableNames, setAvailableNames] = useState([]);
  const [selectedName, setSelectedName] = useState("");

  // Fetch courses
  useEffect(() => {
    async function loadCourses() {
      try {
        let url = "http://localhost:4000/api/courses";
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

  
  const handleJoinCourse = async (nameToUse = null) => {
    if (!joinCode.trim()) return;
    setJoinLoading(true);
    setJoinMessage(null);

    const performJoin = () => fetch("http://localhost:4000/api/courses/join", {
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
        const createUserRes = await fetch("http://localhost:4000/api/users", {
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
    <>
      <main className="relative bg-gray-900 min-h-screen w-full p-8 overflow-y-auto">
        {showNameModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-md w-full shadow-2xl relative text-white">
              <button onClick={() => setShowNameModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
              <h3 className="text-2xl font-bold mb-4">Select Your Name</h3>
              <p className="text-gray-400 mb-6">Identify yourself from the list below:</p>
              <select 
                className="w-full p-3 mb-6 bg-slate-700 border border-slate-600 rounded text-white"
                value={selectedName}
                onChange={(e) => setSelectedName(e.target.value)}
              >
                <option value="">-- Select Name --</option>
                {availableNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              <button onClick={submitNameSelection} disabled={joinLoading || !selectedName} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">
                {joinLoading ? "Joining..." : "Confirm & Join"}
              </button>
            </div>
          </div>
        )}

       
        <div className="w-full max-w-7xl mx-auto px-6 mt-10 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-xl backdrop-blur-sm border border-slate-700">
            <input 
              type="text" 
              placeholder="Enter Token" 
              className="bg-transparent text-white px-3 py-2 outline-none w-40 sm:w-64 placeholder-slate-400"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <button onClick={() => handleJoinCourse()} disabled={joinLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50">
              {joinLoading ? "Joining..." : "Join"}
            </button>
          </div>
        </div>

        {joinMessage && (
          <div className={`mt-4 mx-auto w-fit px-4 py-2 rounded-lg text-white ${joinMessage.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
            {joinMessage.text}
          </div>
        )}

        {/* Courses Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 px-6 mt-10">
          {loading && <p className="text-white text-xl">Loading courses...</p>}
          {!loading && courses.length === 0 && <p className="text-white text-xl">No courses available.</p>}
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

        {!loading && courses.length > coursesPerPage && (
          <div className="flex justify-center items-center gap-6 mt-12 mb-8">
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

        {user?.role === "instructor" && (
          <div className="w-full flex justify-center mt-10 mb-15">
            <Link to="/courses/create" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold shadow-lg">
              + Create Course
            </Link>
          </div>
        )}
      </main>
    </>
  );
}