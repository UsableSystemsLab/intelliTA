export default function Instructions({ title, problemStatement, fileName }) {
    return (
        <div className="w-full h-full bg-slate-800 rounded-lg shadow-xl overflow-hidden border border-slate-700">
            {/* Header Bar */}
            <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-700">
                {title && (
                    <h2 className="text-lg font-semibold text-white">
                        {title}
                    </h2>
                )}
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