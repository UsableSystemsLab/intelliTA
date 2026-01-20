import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader } from "lucide-react";

export default function CreateCourseMain({ user }) {
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");
  const [studentList, setStudentList] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg("");

    // Parse student list
    const allowedStudents = studentList
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    const createCourseRequest = () => fetch("http://localhost:4000/api/courses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer 1111",
      },
      body: JSON.stringify({
        title,
        course_code: courseCode,
        description,
        firebaseId: user?.uid,
        allowed_students: allowedStudents.length > 0 ? allowedStudents : null
      }),
    });

    try {
      let response = await createCourseRequest();

      if (response.status === 404) {
        const data = await response.json();
        if (data.message === "User not found") {
           // Attempt to sync user to Postgres
           /* 
              We need to map Firestore keys (firstName, lastName) 
              to Postgres keys (first_name, last_name).
           */
           const syncResponse = await fetch("http://localhost:4000/api/users", {
             method: "POST",
             headers: { "Content-Type": "application/json",
                        "Authorization": "Bearer 1111",
             },
             body: JSON.stringify({
               firebaseId: user?.uid,
               first_name: user?.firstName || user?.displayName?.split(' ')[0] || "Unknown",
               last_name: user?.lastName || user?.displayName?.split(' ').slice(1).join(' ') || "User",
               email: user?.email
             })
           });

           if (syncResponse.ok) {
             // Retry course creation
             response = await createCourseRequest();
           } else {
             // If sync fails, throw the original error or sync error
             const syncData = await syncResponse.json();
             throw new Error("Account sync failed: " + (syncData.message || syncData.error));
           }
        } else {
           // 404 but not "User not found" (e.g. route not found?)
           throw new Error(data.message || data.error || "Resource not found");
        }
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || "Failed to create course");
      }

      // if creation success, instructor will be navigted to courses page
      navigate("/courses");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 p-22 flex items-start justify-center text-white w-full overflow-y-auto">
      <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-2xl w-full shadow-xl shadow-blue-900/10">
        <h1 className="text-3xl font-bold mb-8 text-white">Create New Course</h1>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6 flex items-center gap-3">
             <AlertCircle className="w-5 h-5" />
             {errorMsg}
          </div>
        )}

        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-300">Course Title</label>
          <input
            type="text"
            className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            placeholder="Enter course title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-300">Course Code</label>
          <input
            type="text"
            className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            placeholder="Enter course code (e.g., CPCS-202)"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
          />
        </div>

        <div className="mb-8">
          <label className="block mb-2 font-medium text-gray-300">Description</label>
          <textarea
            rows="4"
            className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
            placeholder="Write course description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-semibold">Allowed Student Names (Optional)</label>
          <p className="text-sm text-gray-400 mb-2">Enter names separated by new lines. If provided, students must pick a name from this list to join.</p>
          <textarea
            rows="4"
            className="w-full p-3 rounded bg-slate-700 border border-slate-600 outline-none"
            placeholder="Meshal Okairy&#10;Mohanad Babgi&#10;Amer Bugshan&#10;..."
            value={studentList}
            onChange={(e) => setStudentList(e.target.value)}
          ></textarea>
        </div>
        <div className="flex justify-center">
          <button
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 transition-all hover:shadow-blue-600/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
                <>
                 <Loader className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
            ) : (
                "Create Course"
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
