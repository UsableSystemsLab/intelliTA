import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Card from "./CoursesCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Maincontent({ user }) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for making only 6 courses per page appears 
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 6;

  // Fetch courses from backend API GET courses
  useEffect(() => {
    async function loadCourses() {
      try {
        const response = await fetch("http://localhost:4000/api/courses", {
          headers: {
            // also this should not be hard codded. 
            "Content-Type": "application/json",
            "Authorization": "Bearer 1111",
          },
        });

        const data = await response.json();
        setCourses(data);
      } catch (err) {
        console.error("Error loading courses:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  // Pagination Logic
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = courses.slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil(courses.length / coursesPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <>
      <main className="relative bg-gray-900 min-h-screen w-full p-8 overflow-y-auto">
        {/* Courses grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 px-6 mt-10">

          {/* Loading */}
          {loading && <p className="text-white text-xl">Loading courses...</p>}

          {/* if there is no courses, this line will execute */}
          {!loading && courses.length === 0 && (
            <p className="text-white text-xl">No courses available.</p>
          )}

          {/* Render courses dynamically instead of hard coding it */}
          {!loading &&
            currentCourses.map((course) => (
              <Card
                key={course.course_id}
                code={course.course_code}
                title={course.title}
                description={course.description}
                status={false} // we should figure out what we should do with this
              />
            ))}
        </div>

        {/* Pagination Controls */}
        {!loading && courses.length > coursesPerPage && (
            <div className="flex justify-center items-center gap-6 mt-12 mb-8">
                <button 
                    onClick={handlePrevPage} 
                    disabled={currentPage === 1}
                    className={`p-3 rounded-full transition-all duration-200 ${currentPage === 1 ? 'text-gray-600 cursor-not-allowed' : 'text-white bg-gray-800 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30'}`}
                    aria-label="Previous Page"
                >
                    <ChevronLeft className={`w-6 h-6 ${isArabic ? 'rotate-180' : ''}`} />
                </button>
                
                <span className="text-gray-400 font-medium">
                    Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span>
                </span>

                <button 
                    onClick={handleNextPage} 
                    disabled={currentPage === totalPages}
                    className={`p-3 rounded-full transition-all duration-200 ${currentPage === totalPages ? 'text-gray-600 cursor-not-allowed' : 'text-white bg-gray-800 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30'}`}
                    aria-label="Next Page"
                >
                    <ChevronRight className={`w-6 h-6 ${isArabic ? 'rotate-180' : ''}`} />
                </button>
            </div>
        )}

        {/* Create course button, and now only instructor can see the button */}
        {user?.role === "instructor" && (
            <div className="w-full flex justify-center mt-10 mb-15">
            <Link
            to="/courses/create"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold shadow-lg transition-all hover:shadow-blue-600/30"
            >
            + Create Course
            </Link>
            </div>
        )}

      </main>
    </>
  );
}
