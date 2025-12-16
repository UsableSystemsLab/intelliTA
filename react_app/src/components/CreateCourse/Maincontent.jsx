import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <main className="flex-1 p-10 flex items-start justify-center text-white">
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-8">Create New Course</h1>

        {errorMsg && (
          <div className="bg-red-600 p-3 rounded mb-4">{errorMsg}</div>
        )}

        <div className="mb-6">
          <label className="block mb-2 font-semibold">Course Title</label>
          <input
            type="text"
            className="w-full p-3 rounded bg-slate-700 border border-slate-600 outline-none"
            placeholder="Enter course title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-semibold">Course Code</label>
          <input
            type="text"
            className="w-full p-3 rounded bg-slate-700 border border-slate-600 outline-none"
            placeholder="Enter course code (e.g., CPCS-202)"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-semibold">Description</label>
          <textarea
            rows="4"
            className="w-full p-3 rounded bg-slate-700 border border-slate-600 outline-none"
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
            placeholder="Ahmed Ali&#10;Sarah Smith&#10;..."
            value={studentList}
            onChange={(e) => setStudentList(e.target.value)}
          ></textarea>
        </div>
        <div className="flex justify-center">
          <button
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : "Create course"}
          </button>
        </div>
      </div>
    </main>
  );
}
