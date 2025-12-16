import { useRef, useEffect } from 'react';

export default function InstructionsModal({
    isOpen,
    onClose,
    title,
    tasks,
    currentTaskIndex,
    onNextTask,
    onPreviousTask,
    totalTasks,
    onHint,
    isVerifying
}) {
    const modalRef = useRef(null);


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {

                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const currentTask = tasks[currentTaskIndex];
    const isFirstTask = currentTaskIndex === 0;
    const isLastTask = currentTaskIndex === totalTasks - 1;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={modalRef}
                className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
                role="dialog"
                aria-modal="true"
            >
                {/* Header with Progress */}
                <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700 rounded-t-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l4 4a1 1 0 01.586 1.414V19a2 2 0 01-2 2z" />
                            </svg>
                            {title || "Activity tasks"}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-1 transition-all"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Stepper Progress */}
                    <div className="relative">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-700 -translate-y-1/2 rounded"></div>
                        <div
                            className="absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 rounded transition-all duration-300"
                            style={{ width: `${(currentTaskIndex / (totalTasks - 1)) * 100}%` }}
                        ></div>
                        <div className="relative flex justify-between">
                            {tasks.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${index <= currentTaskIndex
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : 'bg-slate-800 border-slate-600 text-slate-400'
                                        }`}
                                >
                                    {index + 1}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Task {currentTaskIndex + 1}: {currentTask.title}
                    </h3>

                    <div className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed mb-6">
                        {currentTask.description}
                    </div>

                    {currentTask.requirements && (
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 mb-4">
                            <h4 className="text-sm font-semibold text-slate-200 mb-2 uppercase tracking-wide">Expected Output</h4>
                            <code className="block font-mono text-sm text-emerald-400 bg-black/30 p-2 rounded border border-slate-700/50">
                                {currentTask.requirements}
                            </code>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-900/50 px-6 py-4 border-t border-slate-700 flex justify-between items-center rounded-b-xl">
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                if (onHint) {
                                    onClose();
                                    onHint();
                                }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-yellow-400 text-xs font-medium rounded border border-slate-600 transition-all hover:shadow-lg hover:shadow-yellow-400/10"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Hint
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={onPreviousTask}
                            disabled={isFirstTask || isVerifying}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border border-slate-600 ${isFirstTask || isVerifying
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-slate-800 hover:bg-slate-700 text-white'
                                }`}
                        >
                            Back
                        </button>

                        {isLastTask ? (
                            <button
                                onClick={onNextTask}
                                disabled={isVerifying}
                                className={`px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2 ${isVerifying ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                            >
                                {isVerifying ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Lab'
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={onNextTask}
                                disabled={isVerifying}
                                className={`px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2 ${isVerifying ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                            >
                                {isVerifying ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        Next Task
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
