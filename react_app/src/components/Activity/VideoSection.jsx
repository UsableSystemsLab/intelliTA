import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Video, Maximize, Minimize, Volume2, VolumeX, ChevronUp, Subtitles, List } from 'lucide-react';

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function VideoSection({
    activity,
    videoRef,
    isPlaying,
    currentTime,
    duration,
    checkpoints,
    activeCheckpoint,
    chapters = [],
    onTimeUpdate,
    onDurationChange,
    onPlay,
    onPause,
    onSeek,
    onNext,
    onPrev,
    onRetryCheckpoint,
    CheckpointOverlay,
    captionSegments = [],
    hasArabicCaptions = false,
    captionsEnabled,
    onToggleCaptions,
    captionLang = 'en',
    onToggleCaptionLang
}) {
    const { t } = useTranslation();
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [showChaptersMenu, setShowChaptersMenu] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [prevVolume, setPrevVolume] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hoverTime, setHoverTime] = useState(null);
    const [hoverX, setHoverX] = useState(0);
    const [hoveredChapter, setHoveredChapter] = useState(null);
    const [videoFocused, setVideoFocused] = useState(false);

    const containerRef = useRef(null);
    const timelineRef = useRef(null);
    const speedMenuRef = useRef(null);
    const chaptersMenuRef = useRef(null);

    const isYouTube = activity?.video_url && (activity.video_url.includes('youtube.com') || activity.video_url.includes('youtu.be'));

    const getEmbedUrl = (videoUrl) => {
        if (!videoUrl) return '';
        let embedUrl = videoUrl;
        if (videoUrl.includes('watch?v=')) {
            const videoId = videoUrl.split('watch?v=')[1].split('&')[0];
            embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=0&modestbranding=1&rel=0`;
        } else if (videoUrl.includes('youtu.be/')) {
            const videoId = videoUrl.split('youtu.be/')[1];
            embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=0&modestbranding=1&rel=0`;
        }
        return embedUrl;
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const getCheckpointColor = (status) => {
        switch (status) {
            case 'verified': return 'bg-emerald-500';
            case 'skipped': return 'bg-amber-500';
            case 'completed': return 'bg-blue-500';
            default: return 'bg-yellow-400';
        }
    };

    const getCurrentCaption = () => {
        if (!captionSegments.length) return null;
        for (const seg of captionSegments) {
            if (currentTime >= seg.start && currentTime < seg.end) {
                return seg.text;
            }
        }
        return null;
    };

    const getCurrentChapter = () => {
        if (!chapters.length) return null;
        for (let i = chapters.length - 1; i >= 0; i--) {
            if (currentTime >= chapters[i].start_time_seconds) {
                return chapters[i];
            }
        }
        return chapters[0];
    };

    // --- Playback speed ---
    const changeSpeed = (speed) => {
        setPlaybackSpeed(speed);
        if (videoRef.current) videoRef.current.playbackRate = speed;
        setShowSpeedMenu(false);
    };

    // --- Volume ---
    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        setIsMuted(val === 0);
        if (videoRef.current) videoRef.current.volume = val;
    };

    const toggleMute = () => {
        if (isMuted) {
            const restored = prevVolume > 0 ? prevVolume : 1;
            setVolume(restored);
            setIsMuted(false);
            if (videoRef.current) videoRef.current.volume = restored;
        } else {
            setPrevVolume(volume);
            setVolume(0);
            setIsMuted(true);
            if (videoRef.current) videoRef.current.volume = 0;
        }
    };

    // --- Fullscreen ---
    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    };

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // Track focus: video shortcuts only active after clicking inside the video container
    useEffect(() => {
        const handleMouseDown = (e) => {
            if (containerRef.current && containerRef.current.contains(e.target)) {
                setVideoFocused(true);
            } else {
                setVideoFocused(false);
            }
        };
        document.addEventListener('mousedown', handleMouseDown);
        return () => document.removeEventListener('mousedown', handleMouseDown);
    }, []);

    // --- Keyboard shortcuts ---
    useEffect(() => {
        if (!videoFocused) return;
        const handleKeyDown = (e) => {
            // Don't capture when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
            if (activeCheckpoint) return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    isPlaying ? onPause() : onPlay();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    onSeek(Math.max(0, currentTime - 5));
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    onSeek(Math.min(duration, currentTime + 5));
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'm':
                case 'M':
                    e.preventDefault();
                    toggleMute();
                    break;
                case 'c':
                case 'C':
                    e.preventDefault();
                    if (onToggleCaptions) onToggleCaptions();
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [videoFocused, isPlaying, currentTime, duration, activeCheckpoint, onPlay, onPause, onSeek, onToggleCaptions]);

    // --- Timeline hover preview ---
    const handleTimelineHover = useCallback((e) => {
        if (!timelineRef.current || !duration) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        setHoverTime(pos * duration);
        setHoverX(e.clientX - rect.left);
    }, [duration]);

    const handleTimelineLeave = () => setHoverTime(null);

    // Close speed menu on outside click
    useEffect(() => {
        if (!showSpeedMenu) return;
        const handler = (e) => {
            if (speedMenuRef.current && !speedMenuRef.current.contains(e.target)) {
                setShowSpeedMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showSpeedMenu]);

    // Close chapters menu on outside click
    useEffect(() => {
        if (!showChaptersMenu) return;
        const handler = (e) => {
            if (chaptersMenuRef.current && !chaptersMenuRef.current.contains(e.target)) {
                setShowChaptersMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showChaptersMenu]);

    return (
        <div
            ref={containerRef}
            className={`flex flex-col bg-gray-900 relative border-l border-gray-800 overflow-hidden ${isFullscreen ? 'w-full h-full' : 'w-[40%] h-full'}`}
        >
            {/* Header */}
            <div className="h-10 border-b border-gray-800 bg-gray-900 flex items-center px-4 gap-2 shrink-0">
                <Video className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('videoLesson')}</span>
            </div>

            {/* Video Container */}
            <div className="flex-1 relative flex items-center justify-center bg-black border-b border-gray-800">
                {isYouTube ? (
                    <div className={`absolute inset-0 w-full h-full bg-black flex items-center justify-center transition-opacity duration-300 ${activeCheckpoint ? 'opacity-30 blur-sm' : 'opacity-100'}`}>
                        <iframe
                            src={getEmbedUrl(activity.video_url)}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Activity Video"
                        />
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${activeCheckpoint ? 'opacity-30 blur-sm' : 'opacity-100'}`}
                        src={activity?.video_url || "https://intellita.s3.eu-north-1.amazonaws.com/videos/1770476743889-cpit_252_-_lab_1__object-oriented_programming_overview.mp4"}
                        onTimeUpdate={onTimeUpdate}
                        onLoadedMetadata={(e) => onDurationChange(e.currentTarget.duration)}
                        onPlay={onPlay}
                        onPause={onPause}
                        onEnded={onPause}
                        controls={false}
                    />
                )}

                {!isPlaying && !activeCheckpoint && (
                    <button
                        onClick={onPlay}
                        className="absolute z-10 p-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 backdrop-blur rounded-full transition-all shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105"
                    >
                        <Play className="w-8 h-8 text-white fill-current" />
                    </button>
                )}

                {captionsEnabled && !activeCheckpoint && getCurrentCaption() && (
                    <div
                        className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-black/80 rounded-lg max-w-[90%] text-center pointer-events-none"
                        dir={captionLang === 'ar' ? 'rtl' : 'ltr'}
                    >
                        <span className="text-white text-sm font-medium leading-relaxed">
                            {getCurrentCaption()}
                        </span>
                    </div>
                )}

                {activeCheckpoint && <CheckpointOverlay />}
            </div>

            {/* Video Controls */}
            <div className="bg-gray-900 border-t border-gray-800 flex flex-col shrink-0">
                {/* Current Chapter Display */}
                {chapters.length > 0 && getCurrentChapter() && (
                    <div className="px-4 pt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-500">{t('chapterLabel')}</span>
                        <span className="text-xs font-medium text-white">{getCurrentChapter().title}</span>
                    </div>
                )}
                {/* Timeline */}
                <div className="px-4 py-3 flex items-center gap-4">
                    <span className="text-xs font-mono text-gray-500 w-12 text-right">
                        {formatTime(currentTime)}
                    </span>
                    <div
                        ref={timelineRef}
                        className="flex-1 h-2 bg-gray-800 rounded-full relative overflow-visible group cursor-pointer"
                        onClick={(e) => {
                            if (!activeCheckpoint) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pos = (e.clientX - rect.left) / rect.width;
                                onSeek(pos * duration);
                            }
                        }}
                        onMouseMove={handleTimelineHover}
                        onMouseLeave={handleTimelineLeave}
                    >
                        {/* Progress bar */}
                        <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                        />
                        {/* Scrubber handle */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity border-2 border-blue-500"
                            style={{ left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 8px)` }}
                        />
                        {/* Hover time preview */}
                        {hoverTime !== null && !hoveredChapter && (
                            <div
                                className="absolute -top-9 -translate-x-1/2 px-2 py-1 bg-gray-700 text-white text-xs font-mono rounded-md shadow-lg pointer-events-none border border-gray-600 z-20"
                                style={{ left: `${hoverX}px` }}
                            >
                                {formatTime(hoverTime)}
                            </div>
                        )}
                        {/* Chapter markers */}
                        {chapters.map((chapter, idx) => {
                            const leftPercent = duration ? (chapter.start_time_seconds / duration) * 100 : 0;
                            const isHovered = hoveredChapter?.id === chapter.id || hoveredChapter?.start_time_seconds === chapter.start_time_seconds;
                            return (
                                <div
                                    key={`chapter-${chapter.id || idx}`}
                                    className="absolute top-0 w-1 h-full bg-white/60 hover:bg-white hover:w-1.5 cursor-pointer z-[5] transition-all"
                                    style={{ left: `${leftPercent}%` }}
                                    onMouseEnter={() => setHoveredChapter(chapter)}
                                    onMouseLeave={() => setHoveredChapter(null)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!activeCheckpoint) {
                                            onSeek(chapter.start_time_seconds);
                                        }
                                    }}
                                >
                                    {isHovered && (
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg shadow-xl pointer-events-none border border-gray-600 z-30 whitespace-nowrap">
                                            <div className="font-medium">{chapter.title}</div>
                                            <div className="text-gray-400 text-[10px] font-mono">{formatTime(chapter.start_time_seconds)}</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {/* Checkpoint markers */}
                        {checkpoints.map(cp => (
                            <div
                                key={cp.id}
                                className={`absolute top-0 w-2 h-full z-10 transform -translate-x-1/2 rounded-full transition-transform ${getCheckpointColor(cp.status)} ${
                                    cp.status === 'skipped' ? 'cursor-pointer hover:scale-x-[2] hover:brightness-125' : 'cursor-help hover:scale-x-150'
                                }`}
                                style={{ left: `${duration ? (cp.time / duration) * 100 : 0}%` }}
                                title={cp.status === 'skipped'
                                    ? `${cp.title || cp.question || 'Checkpoint'} — Click to retry`
                                    : `${cp.title || cp.question || 'Checkpoint'} (${cp.status})`
                                }
                                onClick={(e) => {
                                    if (cp.status === 'skipped' && onRetryCheckpoint) {
                                        e.stopPropagation();
                                        onRetryCheckpoint(cp.id);
                                    }
                                }}
                            />
                        ))}
                    </div>
                    <span className="text-xs font-mono text-gray-500 w-12">
                        {formatTime(duration)}
                    </span>
                </div>

                {/* Playback Controls */}
                <div className="h-14 flex items-center justify-between px-4 pb-3">
                    {/* Left: Navigation */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onSeek(0)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                            title="Restart"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onPrev}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={currentTime < 2}
                            title="Previous Checkpoint"
                        >
                            <SkipBack className="w-5 h-5" />
                        </button>

                        {/* Main Play/Pause Button */}
                        <button
                            onClick={isPlaying ? onPause : onPlay}
                            className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full shadow-lg shadow-blue-500/30 transition-all active:scale-95 mx-1"
                        >
                            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>

                        <button
                            onClick={onNext}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                            title="Next Checkpoint"
                        >
                            <SkipForward className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Center: Volume */}
                    <div className="flex items-center gap-2 group/vol">
                        <button
                            onClick={toggleMute}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors"
                            title={isMuted ? "Unmute (M)" : "Mute (M)"}
                        >
                            {isMuted || volume === 0 ? (
                                <VolumeX className="w-4 h-4" />
                            ) : (
                                <Volume2 className="w-4 h-4" />
                            )}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-20 h-1 accent-blue-500 cursor-pointer opacity-60 group-hover/vol:opacity-100 transition-opacity"
                            title={`Volume: ${Math.round(volume * 100)}%`}
                        />
                    </div>

                    {/* Right: Speed, Fullscreen, Checkpoints */}
                    <div className="flex items-center gap-2">
                        {/* CC Toggle */}
                        {captionSegments.length > 0 && (
                            <button
                                onClick={onToggleCaptions}
                                className={`p-2 rounded-lg transition-all ${
                                    captionsEnabled
                                        ? 'text-blue-400 bg-blue-500/20 hover:bg-blue-500/30'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                                title={`Captions ${captionsEnabled ? 'On' : 'Off'} (C)`}
                            >
                                <Subtitles className="w-4 h-4" />
                            </button>
                        )}

                        {/* EN/AR Language Toggle */}
                        {captionsEnabled && hasArabicCaptions && (
                            <button
                                onClick={onToggleCaptionLang}
                                className="px-2 py-1.5 text-xs font-bold rounded-lg transition-all text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700"
                                title={`Switch to ${captionLang === 'en' ? 'Arabic' : 'English'} captions`}
                            >
                                {captionLang === 'en' ? 'AR' : 'EN'}
                            </button>
                        )}

                        {/* Chapters Menu */}
                        {chapters.length > 0 && (
                            <div className="relative" ref={chaptersMenuRef}>
                                <button
                                    onClick={() => setShowChaptersMenu(!showChaptersMenu)}
                                    className={`p-2 rounded-lg transition-all ${
                                        showChaptersMenu
                                            ? 'text-blue-400 bg-blue-500/20'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                                    title="Chapters"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                {showChaptersMenu && (
                                    <div className="absolute bottom-full mb-2 right-0 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-1.5 min-w-[200px] max-h-[300px] overflow-y-auto z-30">
                                        {chapters.map((chapter, idx) => {
                                            const isCurrent = getCurrentChapter()?.id === chapter.id;
                                            return (
                                                <button
                                                    key={chapter.id || idx}
                                                    onClick={() => {
                                                        if (!activeCheckpoint) {
                                                            onSeek(chapter.start_time_seconds);
                                                        }
                                                        setShowChaptersMenu(false);
                                                    }}
                                                    className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-700 transition-colors flex items-center gap-3 ${
                                                        isCurrent ? 'text-blue-400 font-semibold bg-blue-500/10' : 'text-gray-300'
                                                    }`}
                                                >
                                                    <span className="text-xs text-gray-500 font-mono w-10">
                                                        {formatTime(chapter.start_time_seconds)}
                                                    </span>
                                                    <span className="truncate">{chapter.title}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Speed Control */}
                        <div className="relative" ref={speedMenuRef}>
                            <button
                                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                className="flex items-center gap-1 px-2 py-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all text-xs font-medium"
                                title="Playback Speed"
                            >
                                {`${playbackSpeed}x`}
                                <ChevronUp className={`w-3 h-3 transition-transform ${showSpeedMenu ? '' : 'rotate-180'}`} />
                            </button>
                            {showSpeedMenu && (
                                <div className="absolute bottom-full mb-2 right-0 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-1.5 min-w-[80px] z-30">
                                    {SPEED_OPTIONS.map(speed => (
                                        <button
                                            key={speed}
                                            onClick={() => changeSpeed(speed)}
                                            className={`w-full px-4 py-1.5 text-sm text-left hover:bg-gray-700 transition-colors ${
                                                playbackSpeed === speed ? 'text-blue-400 font-semibold' : 'text-gray-300'
                                            }`}
                                        >
                                            {`${speed}x`}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Fullscreen */}
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                            title="Fullscreen (F)"
                        >
                            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </button>

                        <div className="h-6 w-px bg-gray-700"></div>

                        {/* Checkpoint Counter */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg border border-gray-700">
                            <span className="text-xs font-medium text-gray-500">{t('checkpoints')}</span>
                            <span className="text-sm font-bold text-emerald-400">
                                {checkpoints.filter(c => c.status === 'verified').length}
                            </span>
                            <span className="text-xs text-gray-600">/</span>
                            <span className="text-sm font-medium text-gray-400">
                                {checkpoints.length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
