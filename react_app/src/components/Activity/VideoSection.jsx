import { Play, Pause, SkipBack, SkipForward, RotateCcw, Video } from 'lucide-react';

export default function VideoSection({
    activity,
    videoRef,
    isPlaying,
    currentTime,
    duration,
    checkpoints,
    activeCheckpoint,
    onTimeUpdate,
    onDurationChange,
    onPlay,
    onPause,
    onSeek,
    onNext,
    onPrev,
    CheckpointOverlay
}) {
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
        if (!seconds) return "0:00";
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

    return (
        <div className="w-[40%] flex flex-col bg-gray-900 relative border-l border-gray-800 h-full overflow-hidden">
            {/* Header */}
            <div className="h-10 border-b border-gray-800 bg-gray-900 flex items-center px-4 gap-2">
                <Video className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Video Lesson</span>
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

                {activeCheckpoint && <CheckpointOverlay />}
            </div>

            {/* Video Controls */}
            <div className="bg-gray-900 border-t border-gray-800 flex flex-col shrink-0">
                {/* Timeline */}
                <div className="px-4 py-3 flex items-center gap-4">
                    <span className="text-xs font-mono text-gray-500 w-12 text-right">
                        {formatTime(currentTime)}
                    </span>
                    <div
                        className="flex-1 h-2 bg-gray-800 rounded-full relative overflow-visible group cursor-pointer"
                        onClick={(e) => {
                            if (!activeCheckpoint) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pos = (e.clientX - rect.left) / rect.width;
                                onSeek(pos * duration);
                            }
                        }}
                    >
                        {/* Progress bar */}
                        <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                        />
                        {/* Scrubber handle */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity border-2 border-blue-500"
                            style={{ left: `calc(${(currentTime / duration) * 100}% - 8px)` }}
                        />
                        {/* Checkpoint markers */}
                        {checkpoints.map(cp => (
                            <div
                                key={cp.id}
                                className={`absolute top-0 w-2 h-full z-10 transform -translate-x-1/2 rounded-full cursor-help hover:scale-x-150 transition-transform ${getCheckpointColor(cp.status)}`}
                                style={{ left: `${(cp.time / duration) * 100}%` }}
                                title={`${cp.title} (${cp.status})`}
                            />
                        ))}
                    </div>
                    <span className="text-xs font-mono text-gray-500 w-12">
                        {formatTime(duration)}
                    </span>
                </div>

                {/* Playback Controls */}
                <div className="h-14 flex items-center justify-center gap-4 px-4 pb-3">
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
                        className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                    >
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                    </button>

                    <button
                        onClick={onNext}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                        title="Next Checkpoint"
                    >
                        <SkipForward className="w-5 h-5" />
                    </button>

                    {/* Checkpoint Counter */}
                    <div className="h-6 w-px bg-gray-700 mx-2"></div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg border border-gray-700">
                        <span className="text-xs font-medium text-gray-500">Checkpoints</span>
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
    );
}
