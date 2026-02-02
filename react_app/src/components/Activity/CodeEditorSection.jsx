import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import FileExplorer from './FileExplorer';
import { Terminal, Code2, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useState } from 'react';
import Breadcrumb from '../shared/Breadcrumb';

// Markdown Preview Component
function MarkdownPreview({ content }) {
    return (
        <div className="h-full overflow-y-auto px-6 py-4 bg-[#0d1117]">
            <ReactMarkdown
                components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4 pb-2 border-b border-gray-700">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-semibold text-white mb-3 mt-6">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold text-white mb-2 mt-4">{children}</h3>,
                    p: ({ children }) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1 ml-4">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-1 ml-4">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-300">{children}</li>,
                    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                    em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
                    code: ({ children, className }) => {
                        const isBlock = className?.includes("language-");
                        if (isBlock) {
                            return <code className="text-blue-300 text-sm font-mono">{children}</code>;
                        }
                        return (
                            <code className="bg-gray-800 px-1.5 py-0.5 rounded text-blue-400 text-sm font-mono">{children}</code>
                        );
                    },
                    pre: ({ children }) => (
                        <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4 border border-gray-700">{children}</pre>
                    ),
                    a: ({ href, children }) => (
                        <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                            {children}
                        </a>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400 mb-4 bg-gray-800/50 py-2 rounded-r">{children}</blockquote>
                    ),
                    hr: () => <hr className="border-gray-700 my-6" />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}

export default function CodeEditorSection({
    files,
    activeFile,
    feedback,
    activeCheckpoint,
    onFileSelect,
    onFileChange,
    courseName,
    courseId,
    activityTitle
}) {
    const [consoleExpanded, setConsoleExpanded] = useState(true);

    // Check if the active file is a markdown file
    const isMarkdownFile = (fileName) => {
        const ext = fileName?.split('.').pop()?.toLowerCase();
        return ext === 'md' || ext === 'markdown';
    };
    
    return (
        <div className="w-[60%] flex flex-col bg-[#0d1117]">
            {/* Header */}
            <div className="h-10 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sandbox</span>
                    </div>
                    <div className="h-4 w-px bg-gray-700" />
                    <Breadcrumb items={[
                        { label: "Courses", href: "/courses" },
                        { label: courseName, href: `/courses/${courseId}` },
                        { label: activityTitle }
                    ]} />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">
                        {activeFile?.name}
                    </span>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* File Explorer */}
                <FileExplorer
                    files={files}
                    activeFile={activeFile}
                    onFileSelect={onFileSelect}
                />

                {/* Editor + Console */}
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    {/* Editor or Markdown Preview */}
                    <div className={`${consoleExpanded ? 'flex-1' : 'flex-1'} min-h-0`}>
                        {isMarkdownFile(activeFile?.name) ? (
                            <MarkdownPreview content={activeFile?.content || ''} />
                        ) : (
                            <Editor
                                height="100%"
                                path={activeFile.name}
                                language={activeFile.language}
                                value={activeFile.content}
                                onChange={onFileChange}
                                theme="vs-dark"
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    padding: { top: 16 },
                                    scrollBeyondLastLine: false,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                                    lineNumbers: 'on',
                                    renderLineHighlight: 'all',
                                    cursorBlinking: 'smooth',
                                    smoothScrolling: true,
                                }}
                            />
                        )}
                    </div>

                    {/* Console / Output Panel */}
                    <div className={`border-t border-gray-800 bg-[#0d1117] flex flex-col transition-all duration-200 ${consoleExpanded ? 'h-28' : 'h-10'}`}>
                        {/* Console Header */}
                        <button 
                            onClick={() => setConsoleExpanded(!consoleExpanded)}
                            className="h-10 flex items-center justify-between px-4 hover:bg-gray-800/50 transition-colors shrink-0"
                        >
                            <div className="flex items-center gap-2 text-gray-500">
                                <Terminal className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wider">Console</span>
                                {feedback && (
                                    <span className={`ml-2 w-2 h-2 rounded-full ${feedback.type === 'success' ? 'bg-emerald-400' : feedback.type === 'error' ? 'bg-red-400' : 'bg-blue-400'}`}></span>
                                )}
                            </div>
                            {consoleExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                            ) : (
                                <ChevronUp className="w-4 h-4 text-gray-600" />
                            )}
                        </button>
                        
                        {/* Console Content */}
                        {consoleExpanded && (
                            <div className="flex-1 overflow-auto px-4 pb-3 font-mono text-xs">
                                <div className={`${feedback?.type === 'success' ? 'text-emerald-400' : feedback?.type === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
                                    {feedback ? (
                                        <span className="flex items-center gap-2">
                                            <span className="text-gray-600">›</span>
                                            {feedback.message}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2 text-gray-600">
                                            <span>›</span>
                                            Ready...
                                        </span>
                                    )}
                                </div>
                                {activeCheckpoint && (
                                    <div className="text-amber-400 mt-1 flex items-center gap-2">
                                        <span className="text-gray-600">›</span>
                                        <span>Waiting for solution: <strong>{activeCheckpoint.title}</strong></span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
