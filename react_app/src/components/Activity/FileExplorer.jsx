import { FileCode, FileText, FileJson, Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function FileExplorer({ files, activeFile, onFileSelect }) {
    const { t } = useTranslation();
    if (!files) return null;

    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        
        switch (ext) {
            case 'java':
                return <span className="text-orange-400 font-bold text-xs w-4 flex justify-center">{"J"}</span>;
            case 'js':
            case 'jsx':
                return <FileCode className="w-4 h-4 text-yellow-400" />;
            case 'ts':
            case 'tsx':
                return <FileCode className="w-4 h-4 text-blue-400" />;
            case 'html':
                return <FileCode className="w-4 h-4 text-orange-400" />;
            case 'css':
            case 'scss':
                return <FileCode className="w-4 h-4 text-purple-400" />;
            case 'md':
            case 'markdown':
                return <FileText className="w-4 h-4 text-blue-300" />;
            case 'json':
                return <FileJson className="w-4 h-4 text-yellow-300" />;
            default:
                return <FileText className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <div className="w-52 bg-[#0d1117] border-r border-gray-800 flex flex-col shrink-0">
            {/* Header */}
            <div className="h-10 px-4 flex items-center gap-2 border-b border-gray-800 bg-gray-900/50">
                <Folder className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('explorer')}</span>
            </div>
            
            {/* File List */}
            <div className="flex-1 overflow-y-auto py-2">
                {files.map((file) => (
                    <button
                        key={file.name}
                        onClick={() => onFileSelect(file)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-all duration-150 ${
                            activeFile.name === file.name
                                ? 'bg-blue-500/10 text-white border-l-2 border-blue-500'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800/50 border-l-2 border-transparent'
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
