import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Card from "./CoursesCard";
export default function Maincontent({ user }) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <>
      <main className="relative bg-transparent min-h-screen w-full ">
        {/* Background effects */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu blur-3xl sm:-top-80"
        >
          <div
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem]
                 -translate-x-1/2 rotate-[30deg]
                 bg-gradient-to-tr from-blue-100 to-indigo-300 opacity-30
                 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          ></div>
        </div>
        {/* Bottom background effect */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu
               overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        >
          <div
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
            className="relative left-[calc(50%+11rem)] aspect-[1155/678] w-[36.125rem]
                 -translate-x-1/2 -rotate-[30deg]
                 bg-gradient-to-tr from-blue-100 to-indigo-300 opacity-30
                 sm:left-[calc(50%+30rem)] sm:w-[72.1875rem]"
          ></div>
        </div>
        {/* Courses grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 justify-items-center px-6 mt-10">

          {/* Loading */}
          {loading && <p className="text-white text-xl">Loading courses...</p>}

          {/* if there is no courses, this line will execute */}
          {!loading && courses.length === 0 && (
            <p className="text-white text-xl">No courses available.</p>
          )}

          {/* Render courses dynamically instead of hard coding it */}
          {!loading &&
            courses.map((course) => (
              <Card
                key={course.course_id}
                code={course.course_code}
                title={course.title}
                description={course.description}
                status={false} // we should figure out what we should do with this
              />
            ))}
        </div>

        {/* Create course button, and now only instructor can see the button */}
        {user?.role === "instructor" && (
    <div className="w-full flex justify-center mt-20 mb-15">
     <Link
      to="/courses/create"
      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold shadow-lg"
    >
      + Create Course
    </Link>
    </div>
)}

      </main>
    </>
  );
}
