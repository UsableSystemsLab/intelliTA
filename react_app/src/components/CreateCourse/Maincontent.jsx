import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateCourseMain() {
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch("http://localhost:4000/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // we should make this take from env file instead hard coding it
          "Authorization": "Bearer 1111",
        },
        body: JSON.stringify({
          title,
          course_code: courseCode,
          description,
          instructor_ids: [],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create course");
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
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
        
        <div className="flex justify-end gap-4">
           <button
            className="px-6 py-3 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
            onClick={() => navigate('/courses')}
          >
            Cancel
          </button>
          <button
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 transition-all hover:shadow-blue-600/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
                <>
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
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
