import { CheckCircle, FastForward, Code2, Lightbulb, Loader2 } from 'lucide-react';

export default function CheckpointOverlay({
    activeCheckpoint,
    feedback,
    onCheckSolution,
    onSkip,
    onHint,
    hintText,
    isLoadingHint
}) {
    if (!activeCheckpoint) return null;

    return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-200 bg-black/50 backdrop-blur-sm">
            <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-500/30">
                        <Code2 className="w-7 h-7" />
                    </div>

                    <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full mb-3 border border-blue-500/30">
                        Checkpoint
                    </span>

                    <h2 className="text-xl font-bold text-white mb-3">
                        {activeCheckpoint.title}
                    </h2>
                    <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                        {activeCheckpoint.instruction}
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onCheckSolution}
                            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                        >
                            <CheckCircle className="w-5 h-5" />
                            Verify Solution
                        </button>

                        <button
                            onClick={onHint}
                            disabled={isLoadingHint}
                            className="w-full py-2.5 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoadingHint ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Lightbulb className="w-4 h-4" />
                            )}
                            {isLoadingHint ? 'Generating Hint...' : 'Hint'}
                        </button>

                        <button
                            onClick={onSkip}
                            className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-500/30"
                        >
                            <FastForward className="w-4 h-4" />
                            Skip
                        </button>
                    </div>

                    {hintText && (
                        <div className="mt-4 p-3 rounded-xl text-sm text-left bg-amber-500/10 text-amber-200 border border-amber-500/30">
                            <div className="flex items-center gap-2 mb-1.5 text-amber-400 font-semibold">
                                <Lightbulb className="w-4 h-4" />
                                Hint
                            </div>
                            {hintText}
                        </div>
                    )}

                    {feedback && (
                        <div className={`mt-4 p-3 rounded-xl text-sm font-medium ${
                            feedback.type === 'success'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>
                            {feedback.message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
