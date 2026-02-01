import { useState, useEffect, useCallback, useRef } from 'react';

export const DEFAULT_CHECKPOINTS = [
    {
        id: 1,
        time: 180, // 3:00 - Instance and Class Variables
        type: 'challenge',
        title: "Fix the Quantity Counter",
        instruction: "The getTotalQuantity() method returns 1 instead of 3. Fix the Product class by making the 'quantity' variable a class variable (shared across all instances) instead of an instance variable.",
        fileName: "Product.java",
        hint: "Think about the difference between instance variables and class variables. Which type is shared across all objects?",
        status: 'pending',
        check: (files) => {
            const content = files.find(f => f.name === 'Product.java')?.content || "";

            const hasStaticQuantity = /static\s+(private|public|protected)?\s*int\s+quantity/.test(content) ||
                /(private|public|protected)\s+static\s+int\s+quantity/.test(content);
            return hasStaticQuantity;
        }
    },
    {
        id: 2,
        time: 480, // 8:00 - Inheritance - Abstract Class
        type: 'challenge',
        title: "Make Product Abstract",
        instruction: "The Product class should not be instantiated directly. Only concrete subclasses (FoodProduct, ElectricProduct) should be instantiable. Modify the Product class definition to prevent direct instantiation.",
        fileName: "Product.java",
        hint: "There's a Java keyword that prevents a class from being instantiated directly while still allowing subclasses.",
        status: 'pending',
        check: (files) => {
            const content = files.find(f => f.name === 'Product.java')?.content || "";

            const isAbstract = /abstract\s+class\s+Product/.test(content) ||
                /public\s+abstract\s+class\s+Product/.test(content) ||
                /abstract\s+public\s+class\s+Product/.test(content);
            return isAbstract;
        }
    },
    {
        id: 3,
        time: 900, // 15:00 - Polymorphism
        type: 'challenge',
        title: "Polymorphism with Arrays",
        instruction: "In App.java, create an array of Product references that holds FoodProduct and ElectricProduct objects. Then use an enhanced for loop (for-each) to iterate through the array and print each product using System.out.println().",
        fileName: "App.java",
        hint: "A parent class reference can hold child class objects. Use the array type of the parent class and the colon syntax for iteration.",
        status: 'pending',
        check: (files) => {
            const content = files.find(f => f.name === 'App.java')?.content || "";

            const hasProductArray = /Product\s*\[\s*\]\s*\w+\s*=/.test(content);
            const hasEnhancedForLoop = /for\s*\(\s*Product\s+\w+\s*:\s*\w+\s*\)/.test(content);
            return hasProductArray && hasEnhancedForLoop;
        }
    },
    {
        id: 4,
        time: 1320, // 22:00 - Controlling Changes (final methods)
        type: 'challenge',
        title: "Prevent Method Override",
        instruction: "Modify the addToShoppingCart() method in the Product class so that subclasses cannot override it. Do this without changing the method's visibility (keep it public).",
        fileName: "Product.java",
        hint: "There's a Java keyword that locks a method to prevent subclasses from changing its behavior.",
        status: 'pending',
        check: (files) => {
            const content = files.find(f => f.name === 'Product.java')?.content || "";

            const hasFinalMethod = /final\s+(public\s+)?void\s+addToShoppingCart/.test(content) ||
                /public\s+final\s+void\s+addToShoppingCart/.test(content);
            return hasFinalMethod;
        }
    },
    {
        id: 5,
        time: 1680, // 28:00 - Encapsulation
        type: 'challenge',
        title: "Apply Encapsulation",
        instruction: "Add a 'weight' field to the Product class. Make it private (not public) and provide proper getter (getWeight) and setter (setWeight) methods to access it.",
        fileName: "Product.java",
        hint: "Encapsulation means hiding internal data. Use methods to control access to the field instead of exposing it directly.",
        status: 'pending',
        check: (files) => {
            const content = files.find(f => f.name === 'Product.java')?.content || "";

            const hasPrivateWeight = /private\s+(double|float|int)\s+weight/.test(content);
            const hasGetter = /public\s+\w+\s+getWeight\s*\(/.test(content) ||
                /\w+\s+getWeight\s*\(\s*\)\s*\{/.test(content);
            const hasSetter = /public\s+void\s+setWeight\s*\(/.test(content) ||
                /void\s+setWeight\s*\([^)]+\)\s*\{/.test(content);
            return hasPrivateWeight && hasGetter && hasSetter;
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
