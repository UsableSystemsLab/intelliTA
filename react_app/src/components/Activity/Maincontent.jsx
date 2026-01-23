import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ActivityHeader from './ActivityHeader';
import VideoSection from './VideoSection';
import CodeEditorSection from './CodeEditorSection';
import CheckpointOverlay from './CheckpointOverlay';
import LoadingScreen from './LoadingScreen';
import ErrorScreen from './ErrorScreen';
import SubmissionResultOverlay from './SubmissionResultOverlay';

import { useCheckpoints } from '@/components/Activity/useCheckpoints';

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

export default function Maincontent({ user }) {
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

    const [feedback, setFeedback] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResultOverlay, setShowResultOverlay] = useState(false);
    const [submissionScore, setSubmissionScore] = useState(0);

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
        onPlay: () => setIsPlaying(true),
        onSeek: handleSeek,
        INITIAL_FILES: INITIAL_FILES
    });

    useEffect(() => {
        if (!activityId) {
            setLoading(false);
            setFeedback({ type: 'error', message: "No Activity ID provided." });
            return;
        }

        async function loadActivity() {
            try {
                const url = `http://localhost:4000/api/courses/${courseId || '0'}/activities/${activityId}`;
                const res = await fetch(url, {
                    headers: { "Authorization": "Bearer 1111" }
                });

                if (res.ok) {
                    const data = await res.json();
                    setActivity(data);

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

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117] text-gray-100 font-sans h-full">
            <ActivityHeader
                activityTitle={activity.title}
                courseId={courseId}
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
