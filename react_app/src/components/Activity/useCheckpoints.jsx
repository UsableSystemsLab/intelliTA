import { useState, useEffect } from 'react';

// For now, static checkpoints. In the future, this can be passed in from an API.
export const DEFAULT_CHECKPOINTS = [
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

export function useCheckpoints({
    currentTime,
    files,
    setFiles,
    videoRef,
    activeFile,
    setActiveFile,
    onFeedback,
    onPlay
}) {
    const [checkpoints, setCheckpoints] = useState(DEFAULT_CHECKPOINTS);
    const [activeCheckpoint, setActiveCheckpoint] = useState(null);
    const [showHint, setShowHint] = useState(false);

    // Monitoring loop for checkpoints
    useEffect(() => {
        const dueCheckpoints = checkpoints.filter(cp =>
            !cp.completed &&
            cp.time <= currentTime &&
            cp.time >= currentTime - 2
        );

        if (dueCheckpoints.length > 0) {
            dueCheckpoints.forEach(cp => {
                if (cp.type === 'auto_code') {
                    // Handle automatic code updates
                    setFiles(prev => prev.map(f =>
                        f.name === cp.fileName ? { ...f, content: cp.newContent } : f
                    ));

                    if (activeFile.name === cp.fileName) {
                        setActiveFile(prev => ({ ...prev, content: cp.newContent }));
                    }

                    setCheckpoints(prev => prev.map(c => c.id === cp.id ? { ...c, completed: true } : c));
                    onFeedback({ type: 'success', message: `Code Updated: ${cp.title}` });
                    setTimeout(() => onFeedback(null), 3000);
                }
                else if (cp.type === 'challenge') {
                    // Handle manual challenges (Pause video & show overlay)
                    if (!activeCheckpoint || activeCheckpoint.id !== cp.id) {
                        if (videoRef.current) videoRef.current.pause();
                        setActiveCheckpoint(cp);
                        const file = files.find(f => f.name === cp.fileName);
                        if (file) setActiveFile(file);
                    }
                }
            });
        }
    }, [currentTime, checkpoints, activeCheckpoint, files, activeFile]);

    const checkSolution = () => {
        if (!activeCheckpoint) return;

        const isCorrect = activeCheckpoint.check(files);
        if (isCorrect) {
            onFeedback({ type: 'success', message: 'Correct! Continuing lesson...' });
            setCheckpoints(prev => prev.map(cp => cp.id === activeCheckpoint.id ? { ...cp, completed: true } : cp));
            setActiveCheckpoint(null);
            setShowHint(false);
            setTimeout(() => {
                onFeedback(null);
                onPlay(); // Auto-resume
            }, 1000);
        } else {
            onFeedback({ type: 'error', message: 'Incorrect. Try again or use a hint.' });
            setTimeout(() => onFeedback(null), 3000);
        }
    };

    return {
        checkpoints,
        activeCheckpoint,
        showHint,
        setShowHint,
        checkSolution
    };
}
