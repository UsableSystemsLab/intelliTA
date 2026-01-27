import { ChevronsLeft, CheckCircle, Loader, Code2 } from 'lucide-react';

export default function ActivityHeader({
    activityTitle,
    courseId,
    onBack,
    onSubmit,
    isSubmitting
}) {
    return (
        <div className="h-14 border-b border-gray-800 bg-gray-900 px-6 flex items-center justify-between shrink-0 shadow-lg z-10">
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg hover:bg-gray-800 border border-transparent hover:border-gray-700"
                >
                    <ChevronsLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="font-medium text-sm">Back</span>
                </button>
                <div className="h-6 w-px bg-gray-700"></div>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Code2 className="w-5 h-5 text-blue-400" />
                    </div>
                    <h1 className="text-base font-bold text-gray-100 tracking-wide">
                        {activityTitle}
                    </h1>
                </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded-lg shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all"
                >
                    {isSubmitting ? (
                        <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                        <CheckCircle className="w-4 h-4" />
                    )}
                    <span>Submit</span>
                </button>
            </div>
        </div>
    );
}
