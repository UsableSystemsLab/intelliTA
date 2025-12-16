import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Maincontent({ user }) {
    const { courseId } = useParams();
    const { t } = useTranslation();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [codeVisible, setCodeVisible] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Fetch Course Details
    useEffect(() => {
        async function fetchCourse() {
            try {
                const res = await fetch(`http://localhost:4000/api/courses/${courseId}`, {
                    headers: {
                      "Authorization": "Bearer 1111", // TODO: proper auth
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCourse(data);
                }
            } catch (err) {
                console.error("Failed to fetch course:", err);
            } finally {
                setLoading(false);
            }
        }
        if (courseId) fetchCourse();
    }, [courseId]);

    const isInstructor = () => {
        if (!user || !course || !course.instructor) return false;
        return course.instructor.firebaseId === user.uid;
    };

    const handleGenerateNewCode = async () => {
        if (!window.confirm("Are you sure? Old token will stop working.")) return;
        setGenerating(true);
        try {
            const res = await fetch(`http://localhost:4000/api/courses/${courseId}/code`, {
                method: "POST", 
                headers: {
                    "Authorization": "Bearer 1111"
                }
            });
            if (res.ok) {
                const data = await res.json();
                setCourse(prev => ({ ...prev, token: data.token }));
                alert("New token generated!");
            } else {
                alert("Failed to generate token");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(course?.token || "");
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    if (loading) return <div className="text-white p-10">Loading...</div>;
    if (!course) return <div className="text-white p-10">Course not found.</div>;

    return (
        <main className="flex-1 p-8 text-white">
            <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
                <div>
                    <h1 className="text-3xl font-bold">{course.title}</h1>
                    <p className="text-gray-400 mt-2">{course.description}</p>
                </div>
                
                {isInstructor() && (
                     <button 
                        onClick={() => setShowCodeModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                     >
                        Generate Token
                     </button>
                )}
            </div>

            {/* Content Placeholder */}
            <div>
                 <h2 className="text-xl font-semibold mb-4">Activities</h2>
                 <p className="text-gray-400">No activities yet.</p>
            </div>

            {/* Code Modal */}
            {showCodeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-md w-full shadow-2xl relative">
                        <button 
                            onClick={() => setShowCodeModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                        
                        <h3 className="text-2xl font-bold mb-6 text-center">Course Token</h3>
                        
                        <div className="bg-slate-900/50 p-4 rounded-lg flex items-center justify-between mb-6 border border-slate-700">
                            <span className="text-xl font-mono tracking-widest">
                                {codeVisible ? course.token : "******"}
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCodeVisible(!codeVisible)}
                                    className="text-sm text-blue-400 hover:text-blue-300"
                                >
                                    {codeVisible ? "Hide" : "Show"}
                                </button>
                                <button 
                                    onClick={copyToClipboard}
                                    className="text-sm text-green-400 hover:text-green-300"
                                >
                                    {copySuccess ? "Copied!" : "Copy"}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <button 
                                onClick={handleGenerateNewCode}
                                disabled={generating}
                                className="w-full bg-red-600/80 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {generating ? "Generating..." : "Generate New Token"}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-4 text-center">
                            Warning: Generating a new token will invalidate the old one.
                        </p>
                    </div>
                </div>
            )}
        </main>
    );
}