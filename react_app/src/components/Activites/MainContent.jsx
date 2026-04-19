import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE, getAuthHeaders } from "../../config/api";
import { auth } from "@/utils/firebase.js";
import { useTranslation } from "react-i18next";
import CreateActivityModal from "./CreateActivityModal";
import EditActivityModal from "./EditActivityModal";
import GitHubCourseModal from "./GitHubCourseModal";
import Breadcrumb from "../shared/Breadcrumb";
import MembersModal from "../CourseMembers/MembersModal";
import {
    Plus,
    PlayCircle,
    Trash2,
    Key,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    Timer,
    ArrowRight,
    BookOpen,
    Copy,
    RefreshCw,
    X,
    Eye,
    EyeOff,
    Pencil,
    Users,
    Github,
    ShieldCheck
} from "lucide-react";


const getActivityStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return 'upcoming';
    if (now > end) return 'end';
    return 'active';
};


const StatusBadge = ({ status, t }) => {
    const config = {
        upcoming: {
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/30',
            text: 'text-amber-400',
            icon: Timer,
            label: t('statusUpcoming')
        },
        active: {
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/30',
            text: 'text-emerald-400',
            icon: CheckCircle2,
            label: t('statusActive')
        },
        completed: {
            bg: 'bg-gray-500/10',
            border: 'border-gray-500/30',
            text: 'text-gray-400',
            icon: CheckCircle2,
            label: t('statusCompleted')
        },
        end: {
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
            text: 'text-red-400',
            icon: CheckCircle2,
            label: t('statusEnded')
        }
    };

    const { bg, border, text, icon: Icon, label } = config[status] || config.upcoming;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${border} ${text} border`}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    );
};


const ActivityCard = ({ activity, courseId, isInstructor, onDelete, onEdit, onLinkUpdated, navigate, t }) => {
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkValue, setLinkValue] = useState("");
    const [savingLink, setSavingLink] = useState(false);
    const status = getActivityStatus(activity.start_date, activity.end_date);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleSaveLink = async () => {
        if (!linkValue.trim()) return;
        setSavingLink(true);
        try {
            const res = await fetch(
                `${API_BASE}/courses/${courseId}/activities/${activity.activity_id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", ...await getAuthHeaders(auth.currentUser) },
                    body: JSON.stringify({ github_classroom_url: linkValue.trim() }),
                }
            );
            if (res.ok) {
                const updated = await res.json();
                onLinkUpdated(updated);
                setShowLinkInput(false);
                setLinkValue("");
            }
        } catch (err) {
            console.error("Failed to save link:", err);
        } finally {
            setSavingLink(false);
        }
    };

    return (
        <div className="group relative bg-gray-800 border border-gray-700 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/50 hover:-translate-y-1 flex flex-col h-full min-h-[280px]">
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />

            <div className="relative z-10 flex flex-col h-full">
                {/* Header: Icon + Status + Delete */}
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-gray-700/50 rounded-xl group-hover:bg-blue-500/10 transition-colors duration-300">
                        <BookOpen className="w-7 h-7 text-blue-400" strokeWidth={1.5} />
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={status} t={t} />
                        {isInstructor && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(activity);
                                    }}
                                    className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                                    title={t('editActivity')}
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(activity.activity_id);
                                    }}
                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                                    title={t('deleteActivity')}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
                    {activity.title}
                </h3>

                {/* Dates */}
                <div className="space-y-2 mb-6 flex-grow">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>{t('startDate')} {formatDate(activity.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{t('endDate')} {formatDate(activity.end_date)}</span>
                    </div>
                </div>

                {/* Starter Code Repo Button (instructor only) */}
                {isInstructor && activity.github_repo_url && (
                    <a
                        href={activity.github_repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center w-full px-4 py-3 mb-2 bg-gray-900 hover:bg-gray-700 border border-gray-600 text-white rounded-xl font-medium transition-all duration-300"
                    >
                        <Github className="w-4 h-4 mr-2 text-gray-300" />
                        <span className="text-sm">{t('starterCodeRepo')}</span>
                    </a>
                )}

                {/* GitHub Classroom Assignment Link */}
                {activity.github_classroom_url ? (
                    <a
                        href={activity.github_classroom_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center w-full px-4 py-3 mb-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300"
                    >
                        <Github className="w-5 h-5 mr-2" />
                        <span>
                          {isInstructor
                            ? t("viewClassroomAssignment")
                            : t("githubClassroom")}
                        </span>
                    </a>
                ) : isInstructor && (
                    <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                        {showLinkInput ? (
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    placeholder="https://classroom.github.com/a/..."
                                    value={linkValue}
                                    onChange={(e) => setLinkValue(e.target.value)}
                                    className="flex-1 px-3 py-2.5 bg-gray-900 border border-gray-600 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    onClick={handleSaveLink}
                                    disabled={savingLink || !linkValue.trim()}
                                    className="px-3 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    {savingLink ? "..." : t('save')}
                                </button>
                                <button
                                    onClick={() => { setShowLinkInput(false); setLinkValue(""); }}
                                    className="px-3 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowLinkInput(true)}
                                className="inline-flex items-center justify-center w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-xl font-medium transition-all duration-300 border border-dashed border-gray-600 hover:border-gray-500"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                <span className="text-sm">{t('addAssignmentLink')}</span>
                            </button>
                        )}
                    </div>
                )}


                {/* Action Button */}
                <button
                    onClick={() => navigate(`/courses/${courseId}/activities/${activity.activity_id}`)}
                    className="inline-flex items-center justify-center w-full px-4 py-3 bg-gray-700 hover:bg-blue-600 text-white rounded-xl font-medium transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/25"
                >
                    <PlayCircle className="w-5 h-5 mr-2" />
                    <span>{t('startActivity')}</span>
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </button>
            </div>
        </div>
    );
};


const EmptyState = ({ isInstructor, onCreateClick, t }) => (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-6">
        <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 border border-gray-700">
            <BookOpen className="w-10 h-10 text-gray-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-300 mb-2">{t('noActivitiesYet')}</h3>
        <p className="text-gray-500 text-center max-w-md mb-6">
            {isInstructor
                ? t('createFirstActivityInstructor')
                : t('noActivitiesStudent')
            }
        </p>
        {isInstructor && (
            <button
                onClick={onCreateClick}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            >
                <Plus className="w-5 h-5" />
                {t('createFirstActivity')}
            </button>
        )}
    </div>
);


const TokenModal = ({ course, onClose, onGenerate, generating, t }) => {
    const [codeVisible, setCodeVisible] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(course?.token || "");
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="relative bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-md w-full shadow-2xl">
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <Key className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">{t('courseToken')}</h3>
                    </div>

                    <div className="bg-gray-900/50 p-4 rounded-xl flex items-center justify-between mb-6 border border-gray-700">
                        <span className="text-xl font-mono tracking-widest text-white">
                            {codeVisible ? course.token : "••••••"}
                        </span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setCodeVisible(!codeVisible)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                title={codeVisible ? t('hide') : t('show')}
                            >
                                {codeVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={copyToClipboard}
                                className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                                title={t('copy')}
                            >
                                <Copy className={`w-4 h-4 ${copySuccess ? 'text-green-400' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {copySuccess && (
                        <p className="text-green-400 text-sm text-center mb-4">{t('copiedToClipboard')}</p>
                    )}

                    <button
                        onClick={onGenerate}
                        disabled={generating}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                        {generating ? t('generating') : t('generateNewToken')}
                    </button>

                    <p className="flex items-start gap-2 text-xs text-amber-400/80 mt-4">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        {t('tokenWarning')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default function Maincontent({ user }) {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState([]);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [showGitHubModal, setShowGitHubModal] = useState(false);
    const [githubUsername, setGithubUsername] = useState(() => {
        const p = new URLSearchParams(window.location.search);
        return p.get("github") === "verified" ? p.get("username") : null;
    });
    const [githubVerified, setGithubVerified] = useState(() => {
        return new URLSearchParams(window.location.search).get("github") === "verified";
    });
    const [githubMsg, setGithubMsg] = useState(() => {
        const p = new URLSearchParams(window.location.search);
        const result = p.get("github");
        if (result === "verified") return { type: "success", text: `@${p.get("username")}` };
        if (result === "error") return { type: "error", text: p.get("message") || "" };
        return null;
    });

    // Clean up OAuth callback params from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("github")) {
            const url = new URL(window.location);
            url.searchParams.delete("github");
            url.searchParams.delete("username");
            url.searchParams.delete("message");
            window.history.replaceState({}, "", url);
        }
    }, []);

    useEffect(() => {
        async function fetchData() {
            try {

                const courseRes = await fetch(`${API_BASE}/courses/${courseId}`, {
                    headers: await getAuthHeaders(auth.currentUser)
                });

                if (courseRes.ok) {
                    const courseData = await courseRes.json();
                    setCourse(courseData);
                }

                // Fetch Activities
                const activitiesRes = await fetch(`${API_BASE}/courses/${courseId}/activities`, {
                    headers: await getAuthHeaders(auth.currentUser)
                });

                if (activitiesRes.ok) {
                    const activitiesData = await activitiesRes.json();
                    setActivities(activitiesData);
                }

                // Fetch student GitHub status
                if (user?.uid) {
                    const profileRes = await fetch(`${API_BASE}/users/${user.uid}/profile`, {
                        headers: await getAuthHeaders(auth.currentUser),
                    });
                    if (profileRes.ok) {
                        const profileData = await profileRes.json();
                        if (profileData.github_username) {
                            setGithubUsername(profileData.github_username);
                            setGithubVerified(profileData.github_verified || false);
                        }
                    }
                }

            } catch (err) {
                console.error("Failed to fetch data:", err);
            } finally {
                setLoading(false);
            }
        }
        if (courseId) fetchData();
    }, [courseId, user?.uid]);

    const isInstructor = () => {
        if (!user || !course || !course.instructor) return false;
        return course.instructor.firebaseId === user.uid;
    };

    const handleGenerateNewCode = async () => {
        if (!window.confirm(t("confirmGenerateToken"))) return;
        setGenerating(true);
        try {
            const res = await fetch(`${API_BASE}/courses/${courseId}/code`, {
                method: "POST",
                headers: {
                    ...await getAuthHeaders(auth.currentUser)
                }
            });
            if (res.ok) {
                const data = await res.json();
                setCourse(prev => ({ ...prev, token: data.token }));
                alert(t("newTokenGenerated"));
            } else {
                alert(t("failedToGenerateToken"));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteCourse = async () => {
        if (!window.confirm(t("confirmDeleteCourse"))) return;

        try {
            const res = await fetch(`${API_BASE}/courses/${courseId}`, {
                method: "DELETE",
                headers: {
                    ...await getAuthHeaders(auth.currentUser)
                }
            });

            if (res.ok) {
                navigate("/courses");
            } else {
                const data = await res.json();
                alert(data.message || t("failedToDeleteCourse"));
            }
        } catch (err) {
            console.error("Error deleting course:", err);
            alert(t("errorDeletingCourse"));
        }
    };

    const handleDeleteActivity = async (activityId) => {
        if (!window.confirm(t("confirmDeleteActivity"))) return;

        try {
            const res = await fetch(`${API_BASE}/courses/${courseId}/activities/${activityId}`, {
                method: "DELETE",
                headers: {
                    ...await getAuthHeaders(auth.currentUser)
                }
            });

            if (res.ok) {
                setActivities(prev => prev.filter(a => a.activity_id !== activityId));
            } else {
                const data = await res.json();
                alert(data.message || t("failedToDeleteActivity"));
            }
        } catch (err) {
            console.error("Error deleting activity:", err);
            alert(t("errorDeletingActivity"));
        }
    };

    const handleEditActivity = (activity) => {
        setSelectedActivity(activity);
        setShowEditModal(true);
    };

    const handleActivityUpdated = (updatedActivity) => {
        setActivities(prev =>
            prev.map(a => a.activity_id === updatedActivity.activity_id ? updatedActivity : a)
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400">{t('loadingCourse')}</p>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-xl text-gray-400">{t('courseNotFound')}</p>
                </div>
            </div>
        );
    }

    return (
        <main className="relative bg-gray-900 min-h-screen w-full overflow-y-auto">
            {/* Hero Header Section */}
            <div className="relative overflow-hidden border-b border-gray-800">
                {/* Background decoration */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
                    <div className="mb-4">
                        <Breadcrumb items={[
                            { label: t("courses"), href: "/courses" },
                            { label: course.title }
                        ]} />
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex-1">
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                                {course.title}
                            </h1>
                            <p className="text-gray-400 text-lg max-w-2xl">
                                {course.description}
                            </p>
                        </div>

                        {isInstructor() ? (
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => setShowMembersModal(true)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 hover:border-blue-500/50 rounded-xl font-medium transition-all duration-300"
                                >
                                    <Users className="w-4 h-4 text-blue-400" />
                                    {t('members')}
                                </button>
                                <button
                                    onClick={() => setShowCodeModal(true)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 hover:border-blue-500/50 rounded-xl font-medium transition-all duration-300"
                                >
                                    <Key className="w-4 h-4 text-blue-400" />
                                    {t('viewToken')}
                                </button>
                                <button
                                    onClick={() => setShowGitHubModal(true)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 hover:border-blue-500/50 rounded-xl font-medium transition-all duration-300"
                                >
                                    <Github className="w-4 h-4 text-blue-400" />
                                    GitHub
                                </button>
                                <button
                                    onClick={handleDeleteCourse}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-red-500/10 text-gray-300 hover:text-red-400 border border-gray-700 hover:border-red-500/50 rounded-xl font-medium transition-all duration-300"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {t('deleteCourse')}
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                {githubVerified ? (
                                    <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-sm font-medium">
                                        <ShieldCheck className="w-4 h-4" />
                                        {`@${githubUsername}`}
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => {
                                            const redirectBack = window.location.href.split("?")[0];
                                            window.location.href =
                                                `${API_BASE}/github/student-auth` +
                                                `?firebaseId=${encodeURIComponent(user.uid)}` +
                                                `&courseId=${encodeURIComponent(courseId)}` +
                                                `&redirect=${encodeURIComponent(redirectBack)}`;
                                        }}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 hover:border-blue-500/50 rounded-xl font-medium transition-all duration-300"
                                    >
                                        <Github className="w-4 h-4 text-blue-400" />
                                        {t('connectGitHub')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* GitHub callback message */}
            {githubMsg && (
                <div className={`max-w-7xl mx-auto px-6 pt-4`}>
                    <div className={`flex items-center gap-2 text-sm p-3 rounded-xl ${
                        githubMsg.type === "success"
                            ? "text-green-400 bg-green-500/10 border border-green-500/20"
                            : "text-red-400 bg-red-500/10 border border-red-500/20"
                    }`}>
                        {githubMsg.type === "success"
                            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                            : <AlertCircle className="w-4 h-4 shrink-0" />}
                        {githubMsg.text}
                        <button
                            onClick={() => setGithubMsg(null)}
                            className="ml-auto p-1 hover:bg-gray-700 rounded"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}

            {/* Activities Section */}
            <div className="max-w-7xl mx-auto px-6 py-10">
                {/* Section Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{t('activities')}</h2>
                        <p className="text-gray-500 mt-1">
                            {activities.length} {activities.length === 1 ? t('activityAvailableSingular') : t('activityAvailablePlural')}
                        </p>
                    </div>
                    {isInstructor() && activities.length > 0 && (
                        <button
                            onClick={() => setShowActivityModal(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-green-500/25 hover:shadow-green-500/40"
                        >
                            <Plus className="w-5 h-5" />
                            {t('createActivity')}
                        </button>
                    )}
                </div>

                {/* Activities Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activities.length === 0 ? (
                        <EmptyState
                            isInstructor={isInstructor()}
                            onCreateClick={() => setShowActivityModal(true)}
                            t={t}
                        />
                    ) : (
                        activities.map(activity => (
                            <ActivityCard
                                key={activity.activity_id}
                                activity={activity}
                                courseId={courseId}
                                isInstructor={isInstructor()}
                                onDelete={handleDeleteActivity}
                                onEdit={handleEditActivity}
                                onLinkUpdated={handleActivityUpdated}
                                navigate={navigate}
                                t={t}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Modals */}
            <CreateActivityModal
                isOpen={showActivityModal}
                onClose={() => setShowActivityModal(false)}
                courseId={courseId}
                onActivityCreated={(newActivity) => setActivities([...activities, newActivity])}
            />

            <EditActivityModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedActivity(null);
                }}
                courseId={courseId}
                activity={selectedActivity}
                onActivityUpdated={handleActivityUpdated}
            />

            {showCodeModal && (
                <TokenModal
                    course={course}
                    onClose={() => setShowCodeModal(false)}
                    onGenerate={handleGenerateNewCode}
                    generating={generating}
                    t={t}
                />
            )}

            {showMembersModal && (
                <MembersModal
                    courseId={courseId}
                    user={user}
                    onClose={() => setShowMembersModal(false)}
                />
            )}

            {showGitHubModal && (
                <GitHubCourseModal
                    courseId={courseId}
                    onClose={() => setShowGitHubModal(false)}
                />
            )}

        </main>
    );
}