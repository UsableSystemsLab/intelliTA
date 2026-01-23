import { CheckCircle, HelpCircle } from 'lucide-react';

function CodeIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
    );
}

export default function CheckpointOverlay({
    activeCheckpoint,
    showHint,
    feedback,
    onCheckSolution,
    onToggleHint
}) {
    if (!activeCheckpoint) return null;

    return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#161b22] border border-gray-700 p-6 rounded-xl shadow-2xl max-w-md w-full text-center">
                <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CodeIcon />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                    Checkpoint: {activeCheckpoint.title}
                </h2>
                <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                    {activeCheckpoint.instruction}
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onCheckSolution}
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Verify Solution
                    </button>

                    <button
                        onClick={onToggleHint}
                        className="w-full py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <HelpCircle className="w-4 h-4" />
                        {showHint ? "Hide Hint" : "Need a Hint?"}
                    </button>
                </div>

                {showHint && (
                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-200 text-xs text-left">
                        💡 <strong>Hint:</strong> {activeCheckpoint.hint}
                    </div>
                )}

                {feedback && (
                    <div className={`mt-4 p-2 rounded text-sm font-medium ${feedback.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {feedback.message}
                    </div>
                )}
            </div>
        </div>
    );
}
