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
        let url = "http://localhost:4000/api/courses";
        // If user is admin, fetch all courses. Otherwise, filter by user.
        if (user && user.uid && user.role !== "admin") {
          url += `?firebaseId=${user.uid}`;
        }

        const response = await fetch(url, {
          headers: {
            // also this should not be hard codded. 
            "Content-Type": "application/json",
            "Authorization": "Bearer 1111",
          },
        });

        const data = await response.json();
        if (Array.isArray(data)) {
            setCourses(data);
        } else {
            console.error("API returned non-array:", data);
            setCourses([]);
        }
      } catch (err) {
        console.error("Error loading courses:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState(null);
  
  // Name selection state
  const [showNameModal, setShowNameModal] = useState(false);
  const [availableNames, setAvailableNames] = useState([]);
  const [selectedName, setSelectedName] = useState("");

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

        // Handle "User not found" auto-fix similar to Create Course
        if (response.status === 404 && data.message === "User not found") {
             // Try creating user
             const createUserRes = await fetch("http://localhost:4000/api/users", {
                     method: "POST",
                     headers: { "Content-Type": "application/json",
                      "Authorization": "Bearer 1111"  
                      },
                     body: JSON.stringify({
                       firebaseId: user?.uid,
                       first_name: user?.firstName || user?.displayName?.split(' ')[0] || "Unknown",
                       last_name: user?.lastName || user?.displayName?.split(' ').slice(1).join(' ') || "User",
                       email: user?.email
                     })
                });
            
             if (createUserRes.ok) {
                 // Retry join
                 response = await performJoin();
                 data = await response.json();
             }
        }

        if (response.status === 403 && data.requires_name_selection) {
            // Need to pick a name
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
        console.error(err);
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
      <main className="relative bg-transparent min-h-screen w-full ">
        {/* Name Selection Modal */}
        {showNameModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-md w-full shadow-2xl relative text-white">
                    <button 
                        onClick={() => setShowNameModal(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                    <h3 className="text-2xl font-bold mb-4">Select Your Name</h3>
                    <p className="text-gray-400 mb-6">This course requires you to identify yourself from the list below:</p>
                    
                    <select 
                        className="w-full p-3 mb-6 bg-slate-700 border border-slate-600 rounded text-white"
                        value={selectedName}
                        onChange={(e) => setSelectedName(e.target.value)}
                    >
                        <option value="">-- Select Name --</option>
                        {availableNames.map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>

                    <button 
                        onClick={submitNameSelection}
                        disabled={joinLoading || !selectedName}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50"
                    >
                        {joinLoading ? "Joining..." : "Confirm & Join"}
                    </button>
                </div>
            </div>
        )}

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

        {/* Action Bar: Create & Join */}
        <div className="w-full max-w-7xl mx-auto px-6 mt-10 flex flex-col sm:flex-row justify-between items-center gap-4">
             {/* Create Course Button - Available to everyone */}
            <Link
              to="/courses/create"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold shadow-lg whitespace-nowrap"
            >
              + Create Course
            </Link>

            {/* Join Course Section */}
            <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-xl backdrop-blur-sm border border-slate-700">
                <input 
                    type="text" 
                    placeholder="Enter Token" 
                    className="bg-transparent text-white px-3 py-2 outline-none w-40 sm:w-64 placeholder-slate-400"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                />
                <button 
                    onClick={() => handleJoinCourse()}
                    disabled={joinLoading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                    {joinLoading ? "Joining..." : "Join"}
                </button>
            </div>
        </div>
        {joinMessage && (
            <div className={`mt-4 mx-auto w-fit px-4 py-2 rounded-lg text-white ${joinMessage.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
                {joinMessage.text}
            </div>
        )}


        {/* Courses grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 justify-items-center px-6 mt-10 pb-20">

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
                id={course.course_id}
                code={course.course_code}
                title={course.title}
                description={course.description}
                status={false} // we should figure out what we should do with this
              />
            ))}
        </div>

      </main>
    </>
  );
}
