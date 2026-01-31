import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import ActivityHeader from './ActivityHeader';
import VideoSection from './VideoSection';
import CodeEditorSection from './CodeEditorSection';
import CheckpointOverlay from './CheckpointOverlay';
import LoadingScreen from './LoadingScreen';
import ErrorScreen from './ErrorScreen';
import SubmissionResultOverlay from './SubmissionResultOverlay';
import { Play, FileText, Clock, ArrowLeft } from 'lucide-react';
import { useCheckpoints } from '@/components/Activity/useCheckpoints';

// Default fallback files if no starter code is provided
const DEFAULT_FILES = [
    {
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app"></div>
    <script src="script.js"></script>
</body>
</html>`
    },
    {
        name: 'style.css',
        language: 'css',
        content: `body {
    font-family: sans-serif;
    background: #1e1e1e;
    color: white;
}`
    },
    {
        name: 'script.js',
        language: 'javascript',
        content: `// Application Logic
console.log('App starting...');`
    }
];

// Helper to get language from file extension
const getLanguageFromFileName = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const languageMap = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'html': 'html',
        'css': 'css',
        'scss': 'scss',
        'json': 'json',
        'md': 'markdown',
        'py': 'python',
        'java': 'java',
    };
    return languageMap[ext] || 'plaintext';
};

export default function Maincontent({ user }) {
    const { courseId, activityId } = useParams();
    const navigate = useNavigate();
    const videoRef = useRef(null);

    const [activity, setActivity] = useState(null);
    const [courseName, setCourseName] = useState("");
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState(DEFAULT_FILES);
    const [activeFile, setActiveFile] = useState(DEFAULT_FILES[0]);
    const [initialFiles, setInitialFiles] = useState(DEFAULT_FILES);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const [feedback, setFeedback] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResultOverlay, setShowResultOverlay] = useState(false);
    const [submissionScore, setSubmissionScore] = useState(0);
    const [mode, setMode] = useState('preview'); // 'preview' or 'solve'
    const [markdownContent, setMarkdownContent] = useState('');

    const handleSeek = (newTime) => {
        if (videoRef.current) videoRef.current.currentTime = newTime;
    };

    // Initialize Checkpoint Logic Engine
    const {
        checkpoints,
        activeCheckpoint,
        showHint,
        setShowHint,
        checkSolution,
        skipCheckpoint,
        nextCheckpoint,
        prevCheckpoint
    } = useCheckpoints({
        currentTime,
        files,
        setFiles,
        videoRef,
        activeFile,
        setActiveFile,
        onFeedback: setFeedback,
        onPlay: () => {
            if (videoRef.current) videoRef.current.play();
            setIsPlaying(true);
        },
        onPause: () => {
            if (videoRef.current) videoRef.current.pause();
            setIsPlaying(false);
        },
        onSeek: handleSeek,
        INITIAL_FILES: initialFiles
    });

    useEffect(() => {
        if (!activityId) {
            setLoading(false);
            setFeedback({ type: 'error', message: "No Activity ID provided." });
            return;
        }

        async function loadActivity() {
            try {
                // Fetch course name for breadcrumb
                if (courseId) {
                    const courseRes = await fetch(`http://localhost:4000/api/courses/${courseId}`, {
                        headers: { "Authorization": "Bearer 1111" }
                    });
                    if (courseRes.ok) {
                        const courseData = await courseRes.json();
                        setCourseName(courseData.title || "");
                    }
                }

                const url = `http://localhost:4000/api/courses/${courseId || '0'}/activities/${activityId}`;
                const res = await fetch(url, {
                    headers: { "Authorization": "Bearer 1111" }
                });

                if (res.ok) {
                    const data = await res.json();
                    setActivity(data);

                    // Load starter code files if available
                    let loadedFiles = [...DEFAULT_FILES];

                    if (data.starter_code_url) {
                        try {
                            const starterRes = await fetch(data.starter_code_url);
                            if (starterRes.ok) {
                                const starterCode = await starterRes.json();
                                // Add language property if not present
                                loadedFiles = starterCode.map(file => ({
                                    ...file,
                                    language: file.language || getLanguageFromFileName(file.name)
                                }));
                                setInitialFiles(loadedFiles);
                                setFiles(loadedFiles);
                                setActiveFile(loadedFiles[0]);
                            }
                        } catch (starterErr) {
                            console.error("Failed to fetch starter code:", starterErr);
                        }
                    }

                    // Load markdown file and add to files
                    if (data.md_file_url) {
                        try {
                            const mdRes = await fetch(data.md_file_url);
                            if (mdRes.ok) {
                                const mdText = await mdRes.text();
                                setMarkdownContent(mdText); // Store for preview
                                setFiles(prev => {
                                    const exists = prev.some(f => f.name === 'README.md');
                                    if (exists) return prev.map(f => f.name === 'README.md' ? { ...f, content: mdText } : f);
                                    return [...prev, { name: 'README.md', language: 'markdown', content: mdText }];
                                });
                            }
                        } catch (mdErr) {
                            console.error("Failed to fetch MD file:", mdErr);
                        }
                    }
                } else {
                    const errorText = await res.text();
                    setFeedback({ type: 'error', message: `Failed to load activity (Status: ${res.status})` });
                }
            } catch (err) {
                setFeedback({ type: 'error', message: "Network error loading activity." });
            } finally {
                setLoading(false);
            }
        }
        loadActivity();
    }, [courseId, activityId]);


    const isYouTube = activity?.video_url && (activity.video_url.includes('youtube.com') || activity.video_url.includes('youtu.be'));

    useEffect(() => {
        let interval;
        if (isYouTube && isPlaying && !activeCheckpoint) {
            interval = setInterval(() => {
                setCurrentTime(prev => {
                    const newTime = prev + 1;
                    if (!duration) setDuration(600);
                    return newTime;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isYouTube, isPlaying, activeCheckpoint, duration]);


    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        setCurrentTime(videoRef.current.currentTime);
    };

    const handlePlay = () => {
        if (activeCheckpoint && !activeCheckpoint.completed) {
            setFeedback({ type: 'error', message: 'Complete the current challenge to continue!' });
            setTimeout(() => setFeedback(null), 3000);
            return;
        }
        videoRef.current?.play();
        setIsPlaying(true);
    };

    const handlePause = () => {
        videoRef.current?.pause();
        setIsPlaying(false);
    };

    const handleFileChange = (newContent) => {
        setFiles(prev => prev.map(f => f.name === activeFile.name ? { ...f, content: newContent } : f));
        setActiveFile(prev => ({ ...prev, content: newContent }));
    };

    const handleSubmit = async () => {
        if (!user) {
            setFeedback({ type: 'error', message: "You must be logged in to submit." });
            return;
        }
        setIsSubmitting(true);
        try {
            const challenges = checkpoints.filter(cp => cp.type === 'challenge');
            const totalCount = challenges.length;
            const verifiedCount = challenges.filter(cp => cp.status === 'verified').length;
            const calculatedScore = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 100;

            const url = `http://localhost:4000/api/courses/${courseId}/activities/${activityId}/submit`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer 1111"
                },
                body: JSON.stringify({ firebaseId: user.uid, score: calculatedScore })
            });

            if (res.ok) {
                setSubmissionScore(calculatedScore);
                setShowResultOverlay(true);
                setFeedback({ type: 'success', message: `Submission successful!` });
            } else {
                setFeedback({ type: 'error', message: "Submission failed. Please try again." });
            }
        } catch (error) {
            setFeedback({ type: 'error', message: "Network error during submission." });
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setFeedback(null), 5000);
        }
    };

    if (loading) return <LoadingScreen />;

    if (!activity) return (
        <ErrorScreen
            message={feedback?.message}
            onBack={() => navigate(`/courses/${courseId}`)}
            courseId={courseId}
        />
    );

    // Preview mode - show markdown instructions with Start button
    if (mode === 'preview') {
        return (
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117] text-gray-100 font-sans h-full">
                {/* Preview Header */}
                <div className="h-14 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/courses/${courseId}`)}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="text-sm">Back to Course</span>
                        </button>
                        <div className="w-px h-6 bg-gray-700" />
                        <h1 className="text-lg font-semibold text-white">{activity.title}</h1>
                    </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-auto">
                    <div className="max-w-4xl mx-auto px-8 py-8">
                        {/* Activity Info Card */}
                        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8 sticky top-0 z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{activity.title}</h2>
                                        <p className="text-sm text-gray-400">Lab Activity</p>
                                    </div>
                                </div>
                                {activity.end_date && (
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <Clock className="w-4 h-4" />
                                        <span>Due: {new Date(activity.end_date).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setMode('solve')}
                                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-blue-500/20"
                            >
                                <Play className="w-5 h-5" />
                                Start Solving
                            </button>
                        </div>

                        {/* Markdown Instructions */}
                        <div className="bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50">
                                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Instructions</h3>
                            </div>
                            <div className="px-6 py-6">
                                {markdownContent ? (
                                    <ReactMarkdown
                                        components={{
                                            h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4 pb-2 border-b border-gray-700">{children}</h1>,
                                            h2: ({ children }) => <h2 className="text-xl font-semibold text-white mb-3 mt-6">{children}</h2>,
                                            h3: ({ children }) => <h3 className="text-lg font-semibold text-white mb-2 mt-4">{children}</h3>,
                                            p: ({ children }) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
                                            ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1 ml-4">{children}</ul>,
                                            ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-1 ml-4">{children}</ol>,
                                            li: ({ children }) => <li className="text-gray-300">{children}</li>,
                                            strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                                            em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
                                            code: ({ children, className }) => {
                                                const isBlock = className?.includes("language-");
                                                if (isBlock) {
                                                    return <code className="text-blue-300 text-sm font-mono">{children}</code>;
                                                }
                                                return (
                                                    <code className="bg-gray-800 px-1.5 py-0.5 rounded text-blue-400 text-sm font-mono">{children}</code>
                                                );
                                            },
                                            pre: ({ children }) => (
                                                <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4 border border-gray-700">{children}</pre>
                                            ),
                                            a: ({ href, children }) => (
                                                <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                                                    {children}
                                                </a>
                                            ),
                                            blockquote: ({ children }) => (
                                                <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400 mb-4 bg-gray-800/50 py-2 rounded-r">{children}</blockquote>
                                            ),
                                            hr: () => <hr className="border-gray-700 my-6" />,
                                        }}
                                    >
                                        {markdownContent}
                                    </ReactMarkdown>
                                ) : (
                                    <p className="text-gray-500 italic">No instructions available for this activity.</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    // Solve mode - show the lab IDE
    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117] text-gray-100 font-sans h-full">
            <ActivityHeader
                activityTitle={activity.title}
                courseId={courseId}
                courseName={courseName}
                onBack={() => navigate(`/courses`)}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />

            <div className="flex-1 flex overflow-hidden flex-row">
                <CodeEditorSection
                    files={files}
                    activeFile={activeFile}
                    feedback={feedback}
                    activeCheckpoint={activeCheckpoint}
                    onFileSelect={setActiveFile}
                    onFileChange={handleFileChange}
                />

                <VideoSection
                    activity={activity}
                    videoRef={videoRef}
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                    checkpoints={checkpoints}
                    activeCheckpoint={activeCheckpoint}
                    onTimeUpdate={handleTimeUpdate}
                    onDurationChange={setDuration}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onSeek={handleSeek}
                    onNext={nextCheckpoint}
                    onPrev={prevCheckpoint}
                    CheckpointOverlay={() => (
                        <CheckpointOverlay
                            activeCheckpoint={activeCheckpoint}
                            showHint={showHint}
                            feedback={feedback}
                            onCheckSolution={checkSolution}
                            onSkip={skipCheckpoint}
                            onToggleHint={() => setShowHint(!showHint)}
                        />
                    )}
                />
            </div>

            {showResultOverlay && (
                <SubmissionResultOverlay
                    checkpoints={checkpoints}
                    score={submissionScore}
                    courseId={courseId}
                    onClose={() => setShowResultOverlay(false)}
                />
            )}
        </div>
    );
}
