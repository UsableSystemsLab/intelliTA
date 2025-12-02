import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateCourseMain({ user }) {
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
          firebaseId: user?.uid,
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
