import { Play, Pause } from 'lucide-react';

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
    CheckpointOverlay
}) {
    const isYouTube = activity?.video_url && (activity.video_url.includes('youtube.com') || activity.video_url.includes('youtu.be'));

    // Convert to embed URL if needed
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

    return (
        <div className="w-[45%] flex flex-col bg-black relative border-l border-gray-800">
            <div className="flex-1 relative flex items-center justify-center bg-zinc-900 border-b border-gray-800">
                {/* Video Player */}
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
                        onPlay={() => onPlay()}
                        onPause={() => onPause()}
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

                {/* Checkpoint Overlay */}
                {activeCheckpoint && <CheckpointOverlay />}
            </div>

            {/* Video Controls */}
            <div className="h-16 bg-[#161b22] border-t border-gray-800 flex items-center px-4 gap-4">
                <button onClick={isPlaying ? onPause : onPlay} className="text-gray-400 hover:text-white">
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <div
                    className="flex-1 h-1.5 bg-gray-700 rounded-full relative overflow-hidden group cursor-pointer"
                    onClick={(e) => {
                        if (!activeCheckpoint) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pos = (e.clientX - rect.left) / rect.width;
                            const newTime = pos * duration;
                            onSeek(newTime);
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
    );
}
