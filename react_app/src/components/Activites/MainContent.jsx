import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CreateActivityModal from "./CreateActivityModal";
import { Plus, PlayCircle, FileText, Trash2 } from "lucide-react";

export default function Maincontent({ user }) {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState([]);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [codeVisible, setCodeVisible] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Fetch Course Details and Activities
    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch Course
                const courseRes = await fetch(`http://localhost:4000/api/courses/${courseId}`, {
                    headers: { "Authorization": "Bearer 1111" }
                });
                
                if (courseRes.ok) {
                    const courseData = await courseRes.json();
                    setCourse(courseData);
                }

                // Fetch Activities
                const activitiesRes = await fetch(`http://localhost:4000/api/courses/${courseId}/activities`, {
                     headers: { "Authorization": "Bearer 1111" }
                });

                if (activitiesRes.ok) {
                    const activitiesData = await activitiesRes.json();
                    setActivities(activitiesData);
                }

            } catch (err) {
                console.error("Failed to fetch data:", err);
            } finally {
                setLoading(false);
            }
        }
        if (courseId) fetchData();
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

    const handleDeleteCourse = async () => {
        if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
        
        try {
            const res = await fetch(`http://localhost:4000/api/courses/${courseId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": "Bearer 1111"
                }
            });

            if (res.ok) {
                 navigate("/courses");
            } else {
                 const data = await res.json();
                 alert(data.message || "Failed to delete course");
            }
        } catch (err) {
            console.error("Error deleting course:", err);
            alert("An error occurred while deleting the course.");
        }
    };

    const handleDeleteActivity = async (activityId) => {
        if (!window.confirm("Are you sure you want to delete this activity?")) return;
        
        try {
            const res = await fetch(`http://localhost:4000/api/courses/${courseId}/activities/${activityId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": "Bearer 1111"
                }
            });

            if (res.ok) {
                 setActivities(prev => prev.filter(a => a.activity_id !== activityId));
            } else {
                 const data = await res.json();
                 alert(data.message || "Failed to delete activity");
            }
        } catch (err) {
            console.error("Error deleting activity:", err);
            alert("An error occurred while deleting the activity.");
        }
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
                    <div className="flex gap-3">
                     <button 
                        onClick={() => setShowCodeModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                     >
                        Generate Token
                     </button>
                     <button 
                        onClick={handleDeleteCourse}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                     >
                        Delete Course
                     </button>
                    </div>
                )}
            </div>

            {/* Content Placeholder */}
            <div className="mb-8 flex justify-between items-center">
                 <h2 className="text-xl font-semibold">Activities</h2>
                 {isInstructor() && (
                     <button 
                        onClick={() => setShowActivityModal(true)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                     >
                        <Plus size={20} />
                        Create Activity
                     </button>
                 )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                 {activities.length === 0 ? (
                     <p className="text-gray-400 col-span-full">No activities yet.</p>
                 ) : (
                     activities.map(activity => (
                         <div key={activity.activity_id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold group-hover:text-blue-400">{activity.title}</h3>
                                {isInstructor() && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteActivity(activity.activity_id);
                                        }}
                                        className="text-gray-500 hover:text-red-500 transition-colors p-1"
                                        title="Delete Activity"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                             <div className="text-sm text-gray-400 mb-4 space-y-1">
                                 <p>Start: {new Date(activity.start_date).toLocaleString()}</p>
                                 <p>End: {new Date(activity.end_date).toLocaleString()}</p>
                             </div>
                             
                             <div className="flex gap-3 mt-4 flex-wrap">
                                 {activity.video_url && (
                                     <a 
                                         href={activity.video_url} 
                                         target="_blank" 
                                         rel="noopener noreferrer"
                                         className="flex items-center gap-2 text-blue-400 hover:text-blue-300 bg-blue-400/10 px-3 py-1.5 rounded-lg text-sm transition-colors"
                                     >
                                         <PlayCircle size={16} />
                                         Watch Video
                                     </a>
                                 )}
                                 {activity.md_file_url && (
                                     <a 
                                         href={activity.md_file_url} 
                                         target="_blank" 
                                         rel="noopener noreferrer"
                                         className="flex items-center gap-2 text-green-400 hover:text-green-300 bg-green-400/10 px-3 py-1.5 rounded-lg text-sm transition-colors"
                                     >
                                         <FileText size={16} />
                                         View Docs
                                     </a>
                                 )}
                             </div>
                         </div>
                     ))
                 )}
            </div>
            
            <CreateActivityModal 
                isOpen={showActivityModal} 
                onClose={() => setShowActivityModal(false)} 
                courseId={courseId}
                onActivityCreated={(newActivity) => setActivities([...activities, newActivity])}
            />

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