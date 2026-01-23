import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from "@monaco-editor/react";
import Nav from '@/components/Courses/Nav';
import FileExplorer from '@/components/Activity/FileExplorer';
import { Play, Pause, RotateCcw, CheckCircle, HelpCircle, ChevronRight, Terminal, ChevronsLeft, Loader, LayoutTemplate } from 'lucide-react';

const LAB_CHECKPOINTS = [
    {
        id: 1,
        time: 5,
        type: 'challenge',
        title: "HTML Structure",
        instruction: "Add an <h1> tag to the body with the text 'Welcome Agent'.",
        fileName: "index.html",
        hint: "Use the standard heading tag. Ensure the text content matches the requirement exactly.",
        completed: false,
        check: (files) => {
            const content = files.find(f => f.name === 'index.html')?.content || "";
            return content.includes("<h1>Welcome Agent</h1>");
        }
    },
    {
        id: 2,
        time: 10,
        type: 'auto_code',
        title: "Instructor Update: CSS",
        fileName: "style.css",
        newContent: `body {
    font-family: sans-serif;
    background: #1e1e1e;
    color: white;
    text-align: center;
}
h1 {
    color: #4ade80;
    text-transform: uppercase;
    letter-spacing: 2px;
}`,
        completed: false
    },
    {
        id: 3,
        time: 15,
        type: 'challenge',
        title: "JavaScript Logic",
        instruction: "In script.js, log 'System Ready' to the console.",
        fileName: "script.js",
        hint: "Use console.log() to print the exact string.",
        completed: false,
        check: (files) => {
            const content = files.find(f => f.name === 'script.js')?.content || "";
            return content.includes("System Ready");
        }
    }
];

// ... (INITIAL_FILES remains same) ...

// ... (Inside component) ...


const INITIAL_FILES = [
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

export default function Activity({ user }) {
    const { courseId, activityId } = useParams();
    const navigate = useNavigate();
    const videoRef = useRef(null);

    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState(INITIAL_FILES);
    const [activeFile, setActiveFile] = useState(INITIAL_FILES[0]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const [checkpoints, setCheckpoints] = useState(LAB_CHECKPOINTS);
    const [activeCheckpoint, setActiveCheckpoint] = useState(null);
    const [showHint, setShowHint] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [layoutDirection, setLayoutDirection] = useState('row'); // 'row' = Video Left, 'row-reverse' = Video Right
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!user) {
            setFeedback({ type: 'error', message: "You must be logged in to submit." });
            return;
        }

        setIsSubmitting(true);
        try {
            // Calculate score based on completed checkpoints
            const totalCheckpoints = checkpoints.length;
            const completedCount = checkpoints.filter(cp => cp.completed).length;
            const calculatedScore = totalCheckpoints > 0 ? Math.round((completedCount / totalCheckpoints) * 100) : 100;

            const url = `http://localhost:4000/api/courses/${courseId}/activities/${activityId}/submit`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer 1111"
                },
                body: JSON.stringify({
                    firebaseId: user.uid,
                    score: calculatedScore
                })
            });

            if (res.ok) {
                const data = await res.json();
                setFeedback({ type: 'success', message: `Submitted successfully! Score: ${calculatedScore}%` });
            } else {
                setFeedback({ type: 'error', message: "Submission failed. Please try again." });
            }
        } catch (error) {
            console.error(error);
            setFeedback({ type: 'error', message: "Network error during submission." });
        } finally {
            setIsSubmitting(false);
            // Clear success message after a few seconds
            setTimeout(() => setFeedback(null), 5000);
        }
    };

    // Fetch Activity Data
    useEffect(() => {
        if (!activityId) {
            setLoading(false);
            setFeedback({ type: 'error', message: "No Activity ID provided." });
            return;
        }

        async function loadActivity() {
            try {
                // Ensure courseId is used if needed, or just rely on activityId if backend supports it
                const url = `http://localhost:4000/api/courses/${courseId || '0'}/activities/${activityId}`;
                console.log("Fetching Activity:", url);

                const res = await fetch(url, {
                    headers: { "Authorization": "Bearer 1111" }
                });

                if (res.ok) {
                    const data = await res.json();
                    setActivity(data);

                    // Fetch MD file content if available
                    if (data.md_file_url) {
                        try {
                            const mdRes = await fetch(data.md_file_url);
                            if (mdRes.ok) {
                                const mdText = await mdRes.text();
                                setFiles(prev => {
                                    const exists = prev.some(f => f.name === 'README.md');
                                    if (exists) return prev.map(f => f.name === 'README.md' ? { ...f, content: mdText } : f);
                                    return [...prev, { name: 'README.md', language: 'markdown', content: mdText }];
                                });
                            }
                        } catch (mdErr) {
                            console.error("Failed to fetch MD file:", mdErr);
                            // Don't block loading if MD fails
                        }
                    }
                } else {
                    const errorText = await res.text();
                    console.error("Failed to load activity:", res.status, errorText);
                    setFeedback({ type: 'error', message: `Failed to load activity (Status: ${res.status})` });
                }
            } catch (err) {
                console.error("Network error:", err);
                setFeedback({ type: 'error', message: "Network error loading activity." });
            } finally {
                setLoading(false);
            }
        }
        loadActivity();
    }, [courseId, activityId]);

    // --- Video Logic ---
    const isYouTube = activity?.video_url && (activity.video_url.includes('youtube.com') || activity.video_url.includes('youtu.be'));

    // Timer for YouTube simulation
    useEffect(() => {
        let interval;
        if (isYouTube && isPlaying && !activeCheckpoint) {
            interval = setInterval(() => {
                setCurrentTime(prev => {
                    // Simulate random duration if unknown (e.g. 10 mins)
                    const newTime = prev + 1;
                    if (!duration) setDuration(600);
                    return newTime;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isYouTube, isPlaying, activeCheckpoint, duration]);

    // Checkpoints Monitor (Runs whenever time updates, from Video OR Timer)
    useEffect(() => {
        // Find all due checkpoints that are not completed
        // Fix: Only trigger checkpoints that are close to current time (within 1.5s) to avoid triggering old tasks when skipping
        const dueCheckpoints = checkpoints.filter(cp =>
            !cp.completed &&
            cp.time <= currentTime &&
            cp.time >= currentTime - 2
        );

        if (dueCheckpoints.length > 0) {
            dueCheckpoints.forEach(cp => {
                if (cp.type === 'auto_code') {
                    // 1. Update File Content
                    setFiles(prev => prev.map(f =>
                        f.name === cp.fileName ? { ...f, content: cp.newContent } : f
                    ));

                    // 2. Update Active File View if needed
                    if (activeFile.name === cp.fileName) {
                        setActiveFile(prev => ({ ...prev, content: cp.newContent }));
                    }

                    // 3. Mark Complete
                    setCheckpoints(prev => prev.map(c => c.id === cp.id ? { ...c, completed: true } : c));

                    // 4. User Feedback
                    setFeedback({ type: 'success', message: `Code Updated: ${cp.title}` });
                    setTimeout(() => setFeedback(null), 3000);
                }
                else if (cp.type === 'challenge') {
                    // Only activate if we aren't already blocked by this one
                    if (!activeCheckpoint || activeCheckpoint.id !== cp.id) {
                        setIsPlaying(false);
                        if (videoRef.current) videoRef.current.pause();
                        setActiveCheckpoint(cp);

                        // Switch to relevant file
                        const file = files.find(f => f.name === cp.fileName);
                        if (file) setActiveFile(file);
                    }
                }
            });
        }
    }, [currentTime, checkpoints, activeCheckpoint, files, activeFile]);

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

        // If HTML5 video
        videoRef.current?.play();
        setIsPlaying(true);
    };

    const handlePause = () => {
        videoRef.current?.pause();
        setIsPlaying(false);
    };

    // --- File Logic ---
    const handleFileChange = (newContent) => {
        setFiles(prev => prev.map(f => f.name === activeFile.name ? { ...f, content: newContent } : f));
        setActiveFile(prev => ({ ...prev, content: newContent }));
    };

    // --- Challenge Logic ---
    const checkSolution = () => {
        if (!activeCheckpoint) return;

        const isCorrect = activeCheckpoint.check(files);
        if (isCorrect) {
            setFeedback({ type: 'success', message: 'Correct! Continuing lesson...' });

            setCheckpoints(prev => prev.map(cp => cp.id === activeCheckpoint.id ? { ...cp, completed: true } : cp));
            setActiveCheckpoint(null);
            setShowHint(false);

            setTimeout(() => {
                setFeedback(null);
                handlePlay();
            }, 1000);
        } else {
            setFeedback({ type: 'error', message: 'Incorrect. Try again or use a hint.' });
            setTimeout(() => setFeedback(null), 3000);
        }
    };

    if (loading) return (
        <div className="h-screen bg-[#0d1117] flex items-center justify-center text-white">
            <Loader className="w-10 h-10 animate-spin text-blue-500" />
        </div>
    );

    if (!activity) return (
        <div className="h-screen bg-[#0d1117] flex items-center justify-center text-white">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Activity Not Found</h1>
                <p className="text-gray-400 mb-4">{feedback?.message || "Could not load activity data."}</p>
                <button onClick={() => navigate(`/courses/${courseId}`)} className="text-blue-400 hover:underline">
                    Back to Course
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-[#0d1117] text-gray-100 font-sans overflow-hidden">
            <Nav user={user} />

            <div className="flex flex-1 overflow-hidden relative">
                {/* Removed Sidebar */}

                <div className="flex-1 flex overflow-hidden flex-col">
                    {/* Activity Header */}
                    <div className="h-14 border-b border-gray-800 bg-[#161b22] px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(`/courses/${courseId}`)}
                                className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors py-1.5 px-3 rounded-md hover:bg-gray-800"
                            >
                                <ChevronsLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                                <span className="font-medium text-sm">Back</span>
                            </button>
                            <div className="h-6 w-px bg-gray-700 mx-2"></div>
                            <h1 className="text-base font-bold text-gray-100 tracking-wide">
                                {activity.title}
                            </h1>
                        </div>

                        {/* Layout Toggle & Submit */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 text-xs font-bold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 rounded-md shadow-lg transition-all"
                            >
                                {isSubmitting ? (
                                    <Loader className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle className="w-4 h-4" />
                                )}
                                <span>Submit</span>
                            </button>

                            <div className="h-6 w-px bg-gray-700"></div>

                            <button
                                onClick={() => setLayoutDirection(prev => prev === 'row' ? 'row-reverse' : 'row')}
                                className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md border border-gray-700 transition-all"
                                title="Toggle Layout"
                            >
                                <LayoutTemplate className="w-4 h-4" />
                                <span className="hidden sm:inline">Switch Layout</span>
                            </button>
                        </div>
                    </div>

                    <div className={`flex-1 flex overflow-hidden ${layoutDirection === 'row-reverse' ? 'flex-row-reverse' : 'flex-row'}`}>

                        {/* Video Pane */}
                        <div className={`w-[45%] flex flex-col bg-black relative transition-all duration-300 ${layoutDirection === 'row' ? 'border-r border-gray-800' : 'border-l border-gray-800'}`}>
                            <div className="flex-1 relative flex items-center justify-center bg-zinc-900 border-b border-gray-800">
                                <VideoPlayer
                                    videoUrl={activity.video_url}
                                    videoRef={videoRef}
                                    onTimeUpdate={handleTimeUpdate}
                                    onDurationChange={setDuration}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    className={`w-full h-full max-h-full transition-opacity duration-300 ${activeCheckpoint ? 'opacity-30 blur-sm' : 'opacity-100'}`}
                                />

                                {!isPlaying && !activeCheckpoint && (
                                    <button
                                        onClick={handlePlay}
                                        className="absolute z-10 p-4 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full transition-all"
                                    >
                                        <Play className="w-8 h-8 text-white fill-current" />
                                    </button>
                                )}

                                {activeCheckpoint && (
                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-200">
                                        {/* Checkpoint Overlay Content */}
                                        <div className="bg-[#161b22] border border-gray-700 p-6 rounded-xl shadow-2xl max-w-md w-full text-center">
                                            <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CodeIcon />
                                            </div>
                                            <h2 className="text-xl font-bold text-white mb-2">
                                                Checkpoint: {activeCheckpoint.title}
                                            </h2>
                                            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                                                {activeCheckpoint.instruction}
                                            </p>

                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={checkSolution}
                                                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Verify Solution
                                                </button>

                                                <button
                                                    onClick={() => setShowHint(!showHint)}
                                                    className="w-full py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <HelpCircle className="w-4 h-4" />
                                                    {showHint ? "Hide Hint" : "Need a Hint?"}
                                                </button>
                                            </div>

                                            {showHint && (
                                                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-200 text-xs text-left">
                                                    💡 <strong>Hint:</strong> {activeCheckpoint.hint}
                                                </div>
                                            )}

                                            {feedback && (
                                                <div className={`mt-4 p-2 rounded text-sm font-medium ${feedback.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {feedback.message}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="h-16 bg-[#161b22] border-t border-gray-800 flex items-center px-4 gap-4">
                                <button onClick={isPlaying ? handlePause : handlePlay} className="text-gray-400 hover:text-white">
                                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                </button>
                                <div className="flex-1 h-1.5 bg-gray-700 rounded-full relative overflow-hidden group cursor-pointer"
                                    onClick={(e) => {
                                        if (!activeCheckpoint) {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const pos = (e.clientX - rect.left) / rect.width;
                                            const newTime = pos * duration;
                                            if (videoRef.current) videoRef.current.currentTime = newTime;
                                        }
                                    }}
                                >
                                    <div className="absolute inset-y-0 left-0 bg-blue-500 rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }} />

                                    {checkpoints.map(cp => (
                                        <div
                                            key={cp.id}
                                            className={`absolute top-0 w-1 h-full z-10 ${cp.completed ? 'bg-green-500' : 'bg-yellow-500'}`}
                                            style={{ left: `${(cp.time / duration) * 100}%` }}
                                            title={cp.title}
                                        />
                                    ))}
                                </div>
                                <span className="text-xs font-mono text-gray-500">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                            </div>
                        </div>

                        {/* RIGHT: IDE Environment */}
                        <div className="flex-1 flex flex-col bg-[#1e1e1e]">
                            <div className="h-10 border-b border-[#30363d] bg-[#0d1117] flex items-center px-2">
                                <span className="text-xs font-bold text-gray-500 uppercase px-3">Sandbox</span>
                            </div>

                            <div className="flex-1 flex overflow-hidden">
                                <div className="w-48 border-r border-[#30363d] bg-[#0d1117]">
                                    <FileExplorer
                                        files={files}
                                        activeFile={activeFile}
                                        onFileSelect={setActiveFile}
                                    />
                                </div>

                                <div className="flex-1 flex flex-col relative">
                                    <Editor
                                        height="100%"
                                        path={activeFile.name}
                                        language={activeFile.language}
                                        value={activeFile.content}
                                        onChange={handleFileChange}
                                        theme="vs-dark"
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            padding: { top: 10 },
                                            scrollBeyondLastLine: false,
                                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                        }}
                                    />

                                    <div className="h-32 border-t border-[#30363d] bg-[#0d1117] p-2 font-mono text-xs overflow-auto">
                                        <div className="flex items-center gap-2 text-gray-500 mb-2 border-b border-gray-800 pb-1">
                                            <Terminal className="w-3 h-3" />
                                            <span>Console / Output</span>
                                        </div>
                                        <div className="text-gray-300">
                                            {feedback ? `> ${feedback.message}` : "> Ready..."}
                                            <br />
                                            {activeCheckpoint ? `> Waiting for solution to: ${activeCheckpoint.title}...` : ""}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CodeIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
    )
}

function formatTime(seconds) {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// --- Helper Components ---

function VideoPlayer({ videoUrl, videoRef, onTimeUpdate, onDurationChange, onPlay, onPause, className }) {
    // Basic YouTube detection
    const isYouTube = videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'));

    if (isYouTube) {
        // Convert to embed URL if needed
        let embedUrl = videoUrl;
        if (videoUrl.includes('watch?v=')) {
            const videoId = videoUrl.split('watch?v=')[1].split('&')[0];
            embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=0&modestbranding=1&rel=0`;
        } else if (videoUrl.includes('youtu.be/')) {
            const videoId = videoUrl.split('youtu.be/')[1];
            embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=0&modestbranding=1&rel=0`;
        }

        // Note: Full interactive control of YouTube iframe requires the YouTube IFrame API which is complex to add in one shot.
        // For this version, we display the iframe. The 'pause on checkpoint' logic works best with native video.
        // We will try to simulate basic events or just show the video.

        return (
            <div className={`relative w-full h-full bg-black flex items-center justify-center ${className}`}>
                <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Activity Video"
                />
                <div className="absolute inset-0 pointer-events-none bg-transparent">
                    {/* Overlay to block direct interaction if needed, though we need clicks to play */}
                </div>
            </div>
        );
    }

    return (
        <video
            ref={videoRef}
            className={className}
            src={videoUrl || "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={(e) => onDurationChange(e.currentTarget.duration)}
            onPlay={onPlay}
            onPause={onPause}
            controls={false}
        />
    );
}