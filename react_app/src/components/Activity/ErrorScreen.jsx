export default function ErrorScreen({ message, onBack, courseId }) {
    return (
        <div className="h-screen bg-[#0d1117] flex items-center justify-center text-white">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Activity Not Found</h1>
                <p className="text-gray-400 mb-4">{message || "Could not load activity data."}</p>
                <button onClick={onBack} className="text-blue-400 hover:underline">
                    Back to Course
                </button>
            </div>
        </div>
    );
}
