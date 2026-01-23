import { ChevronsLeft, CheckCircle, LayoutTemplate, Loader } from 'lucide-react';

export default function ActivityHeader({
    activityTitle,
    courseId,
    onBack,
    onSubmit,
    isSubmitting
}) {
    return (
        <div className="h-14 border-b border-gray-800 bg-[#161b22] px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors py-1.5 px-3 rounded-md hover:bg-gray-800"
                >
                    <ChevronsLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="font-medium text-sm">Back</span>
                </button>
                <div className="h-6 w-px bg-gray-700 mx-2"></div>
                <h1 className="text-base font-bold text-gray-100 tracking-wide">
                    {activityTitle}
                </h1>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 text-xs font-bold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 rounded-md shadow-lg transition-all"
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
