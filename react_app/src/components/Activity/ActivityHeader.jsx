import { ChevronsLeft, CheckCircle, Loader, Lightbulb } from 'lucide-react';

export default function ActivityHeader({
    activityTitle,
    onBack,
    onSubmit,
    isSubmitting,
    onHintClick,
    isHintOpen
}) {
    return (
        <div className="h-10 border-b border-gray-800 bg-gray-900 px-4 flex items-center justify-between shrink-0 shadow-lg z-10">
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-800"
                    title="Back"
                >
                    <ChevronsLeft className="w-5 h-5" />
                </button>
                <div className="h-5 w-px bg-gray-700" />
                <span className="text-sm font-medium text-gray-200 truncate max-w-[300px]">
                    {activityTitle}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onHintClick}
                    className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                        isHintOpen
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'text-gray-400 hover:text-amber-300 hover:bg-gray-800 border border-transparent hover:border-gray-700'
                    }`}
                >
                    <Lightbulb className="w-4 h-4" />
                    <span>Hint</span>
                </button>
                <button
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 rounded-lg shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all"
                >
                    {isSubmitting ? (
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                    )}
                    <span>Submit</span>
                </button>
            </div>
        </div>
    );
}
