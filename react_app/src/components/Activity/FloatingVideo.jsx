import { useState, useEffect, useRef } from 'react';

export default function FloatingVideo({ videoUrl, title, checkpoints = [] }) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [position, setPosition] = useState({ x: window.innerWidth - 500, y: window.innerHeight - 350 });
    const [size, setSize] = useState({ width: 480, height: 270 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [showCheckpoints, setShowCheckpoints] = useState(false);
    const [currentSeek, setCurrentSeek] = useState(0);

    const containerRef = useRef(null);


    useEffect(() => {

        const safeX = window.innerWidth - 500 > 0 ? window.innerWidth - 500 : 20;
        const safeY = window.innerHeight - 400 > 0 ? window.innerHeight - 400 : 20;
        setPosition({ x: safeX, y: safeY });
    }, []);

    const getEmbedUrl = (url, seekTime) => {
        if (!url) return "";
        const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/;
        const match = url.match(youtubeRegex);
        if (match && match[1]) {
            let baseUrl = `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
            if (seekTime > 0) {
                baseUrl += `&start=${seekTime}`;
            }
            return baseUrl;
        }
        return url;
    };


    const handleMouseDown = (e) => {
        if (e.target.closest('.no-drag')) return;
        setIsDragging(true);
        const rect = containerRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            e.preventDefault();
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            setPosition({ x: newX, y: newY });
        } else if (isResizing) {
            e.preventDefault();
            const rect = containerRef.current.getBoundingClientRect();
            const newWidth = e.clientX - rect.left;

            if (newWidth > 50) {
                setSize({ ...size, width: newWidth });
            }
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
    };

    useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing]);


    const handleCheckpointClick = (seconds) => {
        setCurrentSeek(seconds);
    };

    return (
        <div
            ref={containerRef}
            className={`fixed z-50 transition-shadow duration-300 ease-in-out shadow-2xl rounded-xl overflow-hidden border border-slate-600 bg-slate-900 flex flex-col select-none`}
            style={{
                top: `${position.y}px`,
                left: `${position.x}px`,
                width: `${size.width}px`,

                height: isMinimized ? 'auto' : 'auto',
                maxHeight: '90vh'
            }}
        >
            {/* Header / Drag Handle */}
            <div
                className="bg-slate-800 flex items-center justify-between px-3 py-2 cursor-move border-b border-slate-700 select-none"
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2 overflow-hidden pointer-events-none">
                    <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-bold text-slate-200 truncate">
                        {title || "Tutorial"}
                    </span>
                </div>
                <div className="flex items-center gap-1 no-drag">
                    <button
                        onClick={() => setShowCheckpoints(!showCheckpoints)}
                        className={`p-1.5 rounded transition-all ${showCheckpoints ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-400'}`}
                        title="Checkpoints"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                        title={isMinimized ? "Expand" : "Minimize"}
                    >
                        {isMinimized ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {!isMinimized && (
                <div className="flex flex-col flex-1 bg-black relative">
                    {/* Video Container */}
                    <div
                        className="relative w-full"
                        style={{ paddingBottom: '56.25%' }}
                    >
                        <iframe
                            key={currentSeek}
                            className="absolute top-0 left-0 w-full h-full"
                            src={getEmbedUrl(videoUrl, currentSeek)}
                            title="Video Player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>

                    {/* Checkpoints Drawer */}
                    {showCheckpoints && checkpoints.length > 0 && (
                        <div className="bg-slate-900 border-t border-slate-700 max-h-40 overflow-y-auto custom-scrollbar">
                            <div className="p-2 space-y-1">
                                {checkpoints.map((cp, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleCheckpointClick(cp.timeSeconds)}
                                        className="w-full flex items-center gap-3 p-2 rounded hover:bg-slate-800 text-left transition-colors group"
                                    >
                                        <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded group-hover:bg-blue-400/20">
                                            {cp.timeDisplay}
                                        </span>
                                        <span className="text-sm text-slate-300 group-hover:text-white truncate">
                                            {cp.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Resize Handle */}
                    <div
                        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20 flex items-end justify-end p-0.5 opacity-50 hover:opacity-100"
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            setIsResizing(true);
                        }}
                    >
                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9M20 12v9" />
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
}
