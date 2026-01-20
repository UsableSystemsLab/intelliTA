export default function FileExplorer({ files, activeFile, onFileSelect }) {
    if (!files) return null;

    const getFileIcon = (fileName) => {
        if (fileName.endsWith('.java')) {
            return (
                <span className="text-orange-500 font-bold text-xs w-4 flex justify-center">J</span>
            );
        }
        if (fileName.endsWith('.md')) {
            return (
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        }
        return (
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l4 4a1 1 0 01.586 1.414V19a2 2 0 01-2 2z" />
            </svg>
        );
    };

    return (
        <div className="w-48 bg-slate-900 border-r border-slate-700 flex flex-col">
            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/50">
                Explorer
            </div>
            <div className="flex-1 overflow-y-auto py-2">
                {files.map((file) => (
                    <button
                        key={file.name}
                        onClick={() => onFileSelect(file)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${activeFile.name === file.name
                                ? 'bg-slate-800 text-white border-l-2 border-emerald-500'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-l-2 border-transparent'
                            }`}
                    >
                        {getFileIcon(file.name)}
                        <span className="truncate">{file.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
