export default function CompletionModal({ isOpen, onClose, grade, onGoBack }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center transform animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Congratulations!</h2>
                <p className="text-gray-400 mb-6">
                    You have successfully completed the lab.
                </p>

                <div className="bg-slate-900/50 rounded-xl p-4 mb-8 border border-slate-700/50">
                    <span className="block text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Your Grade</span>
                    <span className="block text-4xl font-bold text-emerald-400">{grade}%</span>
                </div>

                <button
                    onClick={onGoBack}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                    Back to Courses
                </button>
            </div>
        </div>
    );
}
