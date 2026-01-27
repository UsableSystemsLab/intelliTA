import { useState, useEffect, useCallback, useRef } from 'react';

export const DEFAULT_CHECKPOINTS = [
    {
        id: 1,
        time: 5,
        type: 'challenge',
        title: "HTML Structure",
        instruction: "Add an <h1> tag to the body with the text 'Welcome Agent'.",
        fileName: "index.html",
        hint: "Use the standard heading tag.",
        status: 'pending', // 'pending', 'verified', 'skipped'
        check: (files) => {
            const content = files.find(f => f.name === 'index.html')?.content || "";
            return content.includes("<h1>Welcome Agent</h1>");
        }
    },
    {
        id: 2,
        time: 10,
        type: 'challenge', // Changed from auto_code to challenge
        title: "CSS Styling",
        instruction: "In style.css, set the body background to '#1e1e1e' and text color to 'white'.",
        fileName: "style.css",
        hint: "Target the 'body' selector.",
        status: 'pending',
        check: (files) => {
            const content = files.find(f => f.name === 'style.css')?.content || "";
            return content.includes("background: #1e1e1e") && content.includes("color: white");
        }
    },
    {
        id: 3,
        time: 15,
        type: 'challenge',
        title: "JavaScript Logic",
        instruction: "In script.js, log 'System Ready' to the console.",
        fileName: "script.js",
        hint: "Use console.log()",
        status: 'pending',
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
    onPlay,
    onPause,
    onSeek,
    INITIAL_FILES
}) {
    const [checkpoints, setCheckpoints] = useState(DEFAULT_CHECKPOINTS);
    const [activeCheckpoint, setActiveCheckpoint] = useState(null);
    const [showHint, setShowHint] = useState(false);
    const prevTimeRef = useRef(currentTime);

    const syncCodeToTime = useCallback((targetTime, autoMark = false) => {
        let newFiles = JSON.parse(JSON.stringify(INITIAL_FILES));
        checkpoints.forEach(cp => {
            if (cp.type === 'auto_code' && cp.time <= targetTime) {
                newFiles = newFiles.map(f =>
                    f.name === cp.fileName ? { ...f, content: cp.newContent } : f
                );
            }
        });

        setFiles(newFiles);
        const currentActive = newFiles.find(f => f.name === activeFile.name);
        if (currentActive) setActiveFile(currentActive);

        if (autoMark) {
            setCheckpoints(prev => prev.map(c => {
                if (c.time <= targetTime && c.status === 'pending') {
                    return { ...c, status: c.type === 'auto_code' ? 'completed' : 'skipped' };
                }
                return c;
            }));
        }
    }, [INITIAL_FILES, checkpoints, activeFile.name, setFiles, setActiveFile]);

    useEffect(() => {
        const timeDelta = Math.abs(currentTime - prevTimeRef.current);
        if (timeDelta > 2) {
            syncCodeToTime(currentTime, true);
            setActiveCheckpoint(null);
        }
        prevTimeRef.current = currentTime;

        const dueCheckpoints = checkpoints.filter(cp =>
            cp.status === 'pending' &&
            currentTime >= cp.time &&
            currentTime <= cp.time + 1
        );

        if (dueCheckpoints.length > 0) {
            const cp = dueCheckpoints[0];
            if (cp.type === 'auto_code') {
                setFiles(prev => prev.map(f =>
                    f.name === cp.fileName ? { ...f, content: cp.newContent } : f
                ));
                if (activeFile.name === cp.fileName) setActiveFile(prev => ({ ...prev, content: cp.newContent }));
                setCheckpoints(prev => prev.map(c => c.id === cp.id ? { ...c, status: 'completed' } : c));
                onFeedback({ type: 'success', message: `Code Updated: ${cp.title}` });
                setTimeout(() => onFeedback(null), 3000);
            }
            else if (cp.type === 'challenge') {
                if (!activeCheckpoint || activeCheckpoint.id !== cp.id) {
                    onPause();
                    setActiveCheckpoint(cp);
                    const file = files.find(f => f.name === cp.fileName);
                    if (file) setActiveFile(file);
                }
            }
        }
    }, [currentTime, checkpoints, activeCheckpoint, files, activeFile, onFeedback, onPause, setActiveFile, setFiles, syncCodeToTime]);

    const checkSolution = () => {
        if (!activeCheckpoint) return;
        const isCorrect = activeCheckpoint.check(files);
        if (isCorrect) {
            onFeedback({ type: 'success', message: 'Correct! Continuing lesson...' });
            setCheckpoints(prev => prev.map(cp => cp.id === activeCheckpoint.id ? { ...cp, status: 'verified' } : cp));
            setActiveCheckpoint(null);
            setShowHint(false);
            setTimeout(() => {
                onFeedback(null);
                onPlay();
            }, 1000);
        } else {
            onFeedback({ type: 'error', message: 'Incorrect. Try again or use a hint.' });
            setTimeout(() => onFeedback(null), 3000);
        }
    };

    const skipCheckpoint = () => {
        if (!activeCheckpoint) return;
        setCheckpoints(prev => prev.map(cp => cp.id === activeCheckpoint.id ? { ...cp, status: 'skipped' } : cp));
        setActiveCheckpoint(null);
        setShowHint(false);
        onFeedback({ type: 'info', message: 'Checkpoint skipped.' });
        setTimeout(() => {
            onFeedback(null);
            onPlay();
        }, 1000);
    };

    const jumpToCheckpoint = (index) => {
        const cp = checkpoints[index];
        if (!cp) return;
        onSeek(cp.time);
        onPlay();
    };

    const nextCheckpoint = () => {
        const targetIndex = checkpoints.findIndex(cp => cp.time > currentTime + 0.5);
        if (targetIndex !== -1) jumpToCheckpoint(targetIndex);
    };

    const prevCheckpoint = () => {
        const reversedIndex = [...checkpoints].reverse().findIndex(cp => cp.time < currentTime - 2);
        if (reversedIndex !== -1) {
            const actualIndex = checkpoints.length - 1 - reversedIndex;
            jumpToCheckpoint(actualIndex);
        }
    };

    return {
        checkpoints,
        activeCheckpoint,
        showHint,
        setShowHint,
        checkSolution,
        skipCheckpoint,
        jumpToCheckpoint,
        nextCheckpoint,
        prevCheckpoint
    };
}
