import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Quiz types that pause the video and show an overlay (non-code-editing types)
const QUIZ_OVERLAY_TYPES = ['mcq', 'true_false', 'fill_blank'];

/**
 * Convert quiz JSON items into checkpoints
 */
function quizToCheckpoints(quizQuestions) {
    if (!quizQuestions || quizQuestions.length === 0) return [];

    return quizQuestions.map(q => {
        const base = {
            ...q,
            id: `quiz_${q.id}`,
            status: 'pending',
        };

        if (q.type === 'coding') {
            // Convert regex string to a check function (same shape as challenge checkpoints)
            const regex = new RegExp(q.check);
            return {
                ...base,
                type: 'challenge', 
                check: (files) => {
                    const content = files.find(f => f.name === q.fileName)?.content || "";
                    return regex.test(content);
                }
            };
        }

        // mcq, true_false, fill_blank — no file check needed
        return base;
    });
}

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
    INITIAL_FILES,
    quizQuestions = [],
    onAnswerRecorded,
    answeredQuestions = []
}) {
    // Build merged + sorted checkpoint list when quizQuestions change
    // Mark questions the student already answered correctly as 'verified'
    const initialCheckpoints = useMemo(() => {
        // Build a set of question IDs the student answered correctly
        const correctIds = new Set(
            answeredQuestions
                .filter(a => a.is_correct)
                .map(a => a.question_id)
        );

        const quizCps = quizToCheckpoints(quizQuestions).map(cp => {
            const numericId = typeof cp.id === 'string' && cp.id.startsWith('quiz_')
                ? parseInt(cp.id.replace('quiz_', ''), 10)
                : cp.id;
            if (correctIds.has(numericId)) {
                return { ...cp, status: 'verified' };
            }
            return cp;
        });

        return [...quizCps].sort((a, b) => a.time - b.time);
    }, [quizQuestions, answeredQuestions]);

    const [checkpoints, setCheckpoints] = useState(initialCheckpoints);
    const [activeCheckpoint, setActiveCheckpoint] = useState(null);
    const [showHint, setShowHint] = useState(false);
    const prevTimeRef = useRef(currentTime);

    // Re-sync checkpoints when quizQuestions change (e.g. after fetch)
    useEffect(() => {
        setCheckpoints(initialCheckpoints);
    }, [initialCheckpoints]);

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
        const seekedBackward = currentTime < prevTimeRef.current - 2;
        if (timeDelta > 2) {
            syncCodeToTime(currentTime, true);
            setActiveCheckpoint(null);

            // Reset skipped checkpoints that are ahead of (or at) the new time
            if (seekedBackward) {
                setCheckpoints(prev => prev.map(c => {
                    if (c.status === 'skipped' && c.time >= currentTime) {
                        return { ...c, status: 'pending' };
                    }
                    return c;
                }));
            }
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
                // challenge + coding quiz type — pause and show code editor overlay
                if (!activeCheckpoint || activeCheckpoint.id !== cp.id) {
                    onPause();
                    setActiveCheckpoint(cp);
                    const file = files.find(f => f.name === cp.fileName);
                    if (file) setActiveFile(file);
                }
            }
            else if (QUIZ_OVERLAY_TYPES.includes(cp.type)) {
                // mcq, true_false, fill_blank — pause and show quiz overlay
                if (!activeCheckpoint || activeCheckpoint.id !== cp.id) {
                    onPause();
                    setActiveCheckpoint(cp);
                }
            }
        }
    }, [currentTime, checkpoints, activeCheckpoint, files, activeFile, onFeedback, onPause, setActiveFile, setFiles, syncCodeToTime]);

    // For challenge/coding types — check code in editor
    const checkSolution = () => {
        if (!activeCheckpoint) return;
        const isCorrect = activeCheckpoint.check(files);

        // Record answer to backend for coding quiz questions
        const quizId = activeCheckpoint.id;
        if (typeof quizId === 'string' && quizId.startsWith('quiz_') && onAnswerRecorded) {
            const numericId = parseInt(quizId.replace('quiz_', ''), 10);
            const fileName = activeCheckpoint.fileName || activeFile?.name;
            const code = files.find(f => f.name === fileName)?.content || '';
            onAnswerRecorded({ question_id: numericId, answer: code, is_correct: isCorrect });
        }

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

    // For mcq, true_false, fill_blank, this will check the correct answer
    const submitQuizAnswer = (answer) => {
        if (!activeCheckpoint) return;

        let isCorrect = false;
        const type = activeCheckpoint.type;

        if (type === 'mcq') {
            isCorrect = answer === activeCheckpoint.correctAnswer;
        } else if (type === 'true_false') {
            isCorrect = answer === activeCheckpoint.correctAnswer;
        } else if (type === 'fill_blank') {
            isCorrect = answer.trim().toLowerCase() === String(activeCheckpoint.correctAnswer).trim().toLowerCase();
        }

        // Record answer to backend
        const quizId = activeCheckpoint.id;
        const numericId = typeof quizId === 'string' && quizId.startsWith('quiz_')
            ? parseInt(quizId.replace('quiz_', ''), 10)
            : quizId;
        if (onAnswerRecorded) {
            onAnswerRecorded({ question_id: numericId, answer, is_correct: isCorrect });
        }

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
            onFeedback({ type: 'error', message: 'Incorrect. Try again!' });
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
    // Retry the checkpoint
    const retryCheckpoint = (cpId) => {
        const cp = checkpoints.find(c => c.id === cpId);
        if (!cp || cp.status === 'pending') return;
        setCheckpoints(prev => prev.map(c => c.id === cpId ? { ...c, status: 'pending' } : c));
        onSeek(cp.time);
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
        submitQuizAnswer,
        skipCheckpoint,
        jumpToCheckpoint,
        nextCheckpoint,
        prevCheckpoint,
        retryCheckpoint
    };
}
