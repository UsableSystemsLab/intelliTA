export default function VideoPlayer({ videoUrl, title }) {
    // Convert YouTube URL to embed URL
    const getEmbedUrl = (url) => {
        if (!url) return "";

        // Check if it's a YouTube URL
        const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/;
        const match = url.match(youtubeRegex);

        if (match && match[1]) {
            return `https://www.youtube.com/embed/${match[1]}`;
        }

        return url;
    };

    const embedUrl = getEmbedUrl(videoUrl);

    return (
        <div className="bg-slate-800 rounded-lg shadow-xl overflow-hidden border border-slate-700">
            {/* Header Bar */}
            {title && (
                <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-700">
                    <h2 className="text-lg font-semibold text-white">
                        {title}
                    </h2>
                </div>
            )}

            {/* Video Container */}
            <div className="p-4">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                        src={embedUrl}
                        title={title || "Video Player"}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
        </div>
    );
}
