export default function Instructions({ title, problemStatement, fileName, onHint }) {
    return (
        <div className="w-full h-full bg-slate-800 rounded-lg shadow-xl overflow-hidden border border-slate-700">
            {/* Header Bar */}
            <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-700 flex justify-between items-center">
                {title && (
                    <h2 className="text-lg font-semibold text-white">
                        {title}
                    </h2>
                )}
                <button
                    onClick={onHint}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-yellow-400 text-xs font-medium rounded border border-slate-600 transition-all hover:shadow-lg hover:shadow-yellow-400/10 active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Hint
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {problemStatement && (
                    <p className="text-sm text-gray-300 leading-relaxed">
                        {problemStatement}
                    </p>
                )}

                {fileName && (
                    <div className="inline-block px-3 py-1 bg-slate-700 text-gray-200 text-xs font-medium rounded">
                        {fileName}
                    </div>
                )}
            </div>
        </div>
    );
}