import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';

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
            case 'verified': return 'bg-green-500';
            case 'skipped': return 'bg-orange-500';
            case 'completed': return 'bg-blue-500';
            default: return 'bg-yellow-500/80';
        }
    };

    return (
        <div className="w-[45%] flex flex-col bg-black relative border-l border-gray-800 h-full overflow-hidden">
            <div className="flex-1 relative flex items-center justify-center bg-zinc-900 border-b border-gray-800">
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
                        src={activity?.video_url || "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"}
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
                        className="absolute z-10 p-4 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full transition-all"
                    >
                        <Play className="w-8 h-8 text-white fill-current" />
                    </button>
                )}

                {activeCheckpoint && <CheckpointOverlay />}
            </div>

            <div className="bg-[#161b22] border-t border-gray-800 flex flex-col shrink-0">
                <div className="px-4 py-2 flex items-center gap-4">
                    <span className="text-[10px] font-mono text-gray-500 w-10 text-right">
                        {formatTime(currentTime)}
                    </span>
                    <div
                        className="flex-1 h-1.5 bg-gray-700/50 rounded-full relative overflow-visible group cursor-pointer"
                        onClick={(e) => {
                            if (!activeCheckpoint) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pos = (e.clientX - rect.left) / rect.width;
                                onSeek(pos * duration);
                            }
                        }}
                    >
                        <div className="absolute inset-y-0 left-0 bg-blue-500 rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }} />
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ left: `${(currentTime / duration) * 100}%` }}
                        />
                        {checkpoints.map(cp => (
                            <div
                                key={cp.id}
                                className={`absolute top-0 w-1.5 h-full z-10 transform -translate-x-1/2 rounded-full cursor-help hover:scale-x-150 transition-transform ${getCheckpointColor(cp.status)}`}
                                style={{ left: `${(cp.time / duration) * 100}%` }}
                                title={`${cp.title} (${cp.status})`}
                            />
                        ))}
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 w-10">
                        {formatTime(duration)}
                    </span>
                </div>

                <div className="h-12 flex items-center justify-center gap-6 px-4 pb-2">
                    <button onClick={() => onSeek(0)} className="text-gray-400 hover:text-white transition-colors" title="Restart">
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <button onClick={onPrev} className="text-gray-400 hover:text-white transition-colors disabled:opacity-30" disabled={currentTime < 2} title="Previous Checkpoint">
                        <SkipBack className="w-5 h-5" />
                    </button>
                    <button onClick={isPlaying ? onPause : onPlay} className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-all active:scale-95">
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                    </button>
                    <button onClick={onNext} className="text-gray-400 hover:text-white transition-colors" title="Next Checkpoint">
                        <SkipForward className="w-5 h-5" />
                    </button>
                    <div className="h-4 w-px bg-gray-700 hidden sm:block"></div>
                    <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <span>CP</span>
                        <span className="text-gray-300">
                            {checkpoints.filter(c => c.status === 'verified').length}/{checkpoints.length}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
