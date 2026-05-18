import Editor from "@monaco-editor/react";
import { useTranslation } from 'react-i18next';
import ReactMarkdown from "react-markdown";
import FileExplorer from './FileExplorer';
import { Terminal, Code2, ChevronDown, ChevronUp, FileText, Sparkles, Eye, Play, Loader2 } from 'lucide-react';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Breadcrumb from '../shared/Breadcrumb';
import PreviewPane from './PreviewPane';
import { isRunnable } from '../../utils/languageRunMap';

const WEB_EXTS = ['html', 'css', 'js'];
const isWebFile = (name) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    return WEB_EXTS.includes(ext);
};

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
    activityTitle,
    onAskAI,
    onRun,
    runState,
    runOutput,
}) {
    const { t } = useTranslation();
    const [consoleExpanded, setConsoleExpanded] = useState(true);
    const [panelHeight, setPanelHeight] = useState(160);
    const isResizingRef = useRef(false);

    const handleResizeMouseDown = useCallback((e) => {
        e.preventDefault();
        isResizingRef.current = true;
        const startY = e.clientY;
        const startH = panelHeight;
        const containerH = editorContainerRef.current?.getBoundingClientRect().height || window.innerHeight;
        const onMove = (ev) => {
            if (!isResizingRef.current) return;
            const delta = startY - ev.clientY;
            const next = Math.max(40, Math.min(containerH - 80, startH + delta));
            setPanelHeight(next);
        };
        const onUp = () => {
            isResizingRef.current = false;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, [panelHeight]);
    const isWebProject = useMemo(() => {
        // Ignore doc files (e.g. the injected README.md instructions) so they
        // don't suppress the preview; still require real web code + an HTML file.
        const code = files.filter((f) => !/\.(md|markdown|txt)$/i.test(f.name));
        return code.length > 0
            && code.every((f) => isWebFile(f.name))
            && code.some((f) => f.name.toLowerCase().endsWith('.html'));
    }, [files]);
    const [bottomTab, setBottomTab] = useState('console');
    const [previewFloating, setPreviewFloating] = useState(false);
    useEffect(() => {
        if (isWebProject) setBottomTab('preview');
        else setBottomTab('console');
    }, [isWebProject]);
    const handleFloatingChange = useCallback((isFloating) => {
        setPreviewFloating(isFloating);
        if (isFloating) setConsoleExpanded(false);
    }, []);
    const editorRef = useRef(null);
    const monacoRef = useRef(null);
    const [floatingBtn, setFloatingBtn] = useState(null); // { top, left }
    const editorContainerRef = useRef(null);
    const onAskAIRef = useRef(onAskAI);

    // Keep callback ref in sync
    useEffect(() => {
        onAskAIRef.current = onAskAI;
    }, [onAskAI]);

    const handleFloatingClick = useCallback(() => {
        const editor = editorRef.current;
        if (!editor) return;
        const selection = editor.getSelection();
        if (!selection || selection.isEmpty()) return;
        const text = editor.getModel().getValueInRange(selection);
        if (text && onAskAIRef.current) {
            onAskAIRef.current(text);
            setFloatingBtn(null);
        }
    }, []);

    const handleEditorMount = useCallback((editor, monacoInstance) => {
        editorRef.current = editor;
        monacoRef.current = monacoInstance;

        // Ctrl+I keybinding
        editor.addAction({
            id: 'ask-ai',
            label: 'Ask AI about selection',
            keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyI],
            run: (ed) => {
                const sel = ed.getSelection();
                if (!sel || sel.isEmpty()) return;
                const text = ed.getModel().getValueInRange(sel);
                if (text && onAskAIRef.current) {
                    onAskAIRef.current(text);
                    setFloatingBtn(null);
                }
            }
        });

        // Selection change listener
        editor.onDidChangeCursorSelection(() => {
            const selection = editor.getSelection();
            if (!selection || selection.isEmpty()) {
                setFloatingBtn(null);
                return;
            }

            const selectedText = editor.getModel().getValueInRange(selection);
            if (!selectedText.trim()) {
                setFloatingBtn(null);
                return;
            }

            // Get the pixel coordinates of the selection end
            const endPos = { lineNumber: selection.endLineNumber, column: selection.endColumn };
            const coords = editor.getScrolledVisiblePosition(endPos);
            if (coords) {
                const editorDom = editor.getDomNode();
                const editorRect = editorDom.getBoundingClientRect();
                const containerRect = editorContainerRef.current?.getBoundingClientRect();
                if (containerRect) {
                    setFloatingBtn({
                        top: editorRect.top - containerRect.top + coords.top + coords.height + 4,
                        left: editorRect.left - containerRect.left + coords.left + 12,
                    });
                }
            }
        });
    }, []);

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
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('sandbox')}</span>
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
                    {(isRunnable(activeFile?.name) || isWebProject) && onRun && (
                        <button
                            onClick={() => {
                                if (runState === 'running') return;
                                setBottomTab('console');
                                setConsoleExpanded(true);
                                onRun();
                            }}
                            disabled={runState === 'running'}
                            className="ml-2 flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
                            title={t('runCode') || 'Run'}
                        >
                            {runState === 'running' ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Play className="w-3.5 h-3.5" />
                            )}
                            <span>{runState === 'running' ? (t('running') || 'Running…') : (t('run') || 'Run')}</span>
                        </button>
                    )}
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
                <div ref={editorContainerRef} className="flex-1 flex flex-col relative overflow-hidden" dir="ltr">
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
                                onMount={handleEditorMount}
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

                    {/* Floating Ask AI button */}
                    {floatingBtn && (
                        <button
                            onClick={handleFloatingClick}
                            className="absolute z-20 p-1.5 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 text-white shadow-lg shadow-violet-500/40 hover:shadow-violet-500/60 transition-all duration-200 hover:scale-110"
                            style={{ top: floatingBtn.top, left: floatingBtn.left }}
                            title="Ask AI (Ctrl+I)"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {/* Console / Preview Panel */}
                    <div
                        className="border-t border-gray-800 bg-[#0d1117] flex flex-col relative"
                        style={{ height: consoleExpanded ? `${panelHeight}px` : '40px' }}
                    >
                        {/* Resize handle */}
                        {consoleExpanded && (
                            <div
                                onMouseDown={handleResizeMouseDown}
                                className="absolute top-0 left-0 right-0 h-1 -translate-y-1/2 cursor-row-resize hover:bg-blue-500/40 z-10"
                                title="Drag to resize"
                            />
                        )}
                        {/* Tab / Header bar */}
                        <div className="h-10 flex items-center justify-between pr-2 shrink-0 border-b border-gray-800/60">
                            <div className="flex items-stretch h-full">
                                <button
                                    onClick={() => {
                                        if (bottomTab === 'console' && consoleExpanded) setConsoleExpanded(false);
                                        else { setBottomTab('console'); setConsoleExpanded(true); }
                                    }}
                                    className={`flex items-center gap-2 px-4 text-xs font-medium uppercase tracking-wider transition-colors ${
                                        bottomTab === 'console'
                                            ? 'text-gray-200 bg-gray-800/40'
                                            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
                                    }`}
                                >
                                    <Terminal className="w-4 h-4" />
                                    <span>{t('consoleTab')}</span>
                                    {feedback && (
                                        <span
                                            className={`ml-1 w-2 h-2 rounded-full ${
                                                feedback.type === 'success'
                                                    ? 'bg-emerald-400'
                                                    : feedback.type === 'error'
                                                    ? 'bg-red-400'
                                                    : 'bg-blue-400'
                                            }`}
                                        ></span>
                                    )}
                                </button>
                                {isWebProject && (
                                    <button
                                        onClick={() => {
                                            if (bottomTab === 'preview' && consoleExpanded) setConsoleExpanded(false);
                                            else { setBottomTab('preview'); setConsoleExpanded(true); }
                                        }}
                                        className={`flex items-center gap-2 px-4 text-xs font-medium uppercase tracking-wider transition-colors ${
                                            bottomTab === 'preview'
                                                ? 'text-gray-200 bg-gray-800/40'
                                                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
                                        }`}
                                    >
                                        <Eye className="w-4 h-4" />
                                        <span>{t('previewTab')}</span>
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setConsoleExpanded(!consoleExpanded)}
                                className="p-1.5 rounded hover:bg-gray-800/50 transition-colors"
                            >
                                {consoleExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-600" />
                                ) : (
                                    <ChevronUp className="w-4 h-4 text-gray-600" />
                                )}
                            </button>
                        </div>

                        {/* Panel Content */}
                        {consoleExpanded && bottomTab === 'console' && (
                            <div className="flex-1 overflow-auto px-4 py-2 font-mono text-xs">
                                <div className={`${feedback?.type === 'success' ? 'text-emerald-400' : feedback?.type === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
                                    {feedback ? (
                                        <span className="flex items-center gap-2">
                                            <span className="text-gray-600">{"›"}</span>
                                            {feedback.message}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2 text-gray-600">
                                            <span>{"›"}</span>
                                            {t('ready')}
                                        </span>
                                    )}
                                </div>
                                {activeCheckpoint && (
                                    <div className="text-amber-400 mt-1 flex items-center gap-2">
                                        <span className="text-gray-600">{"›"}</span>
                                        <span>{t('waitingForSolution')} <strong>{activeCheckpoint.title}</strong></span>
                                    </div>
                                )}
                                {runState === 'running' && (
                                    <div className="text-blue-400 mt-2 flex items-center gap-2">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>{t('running') || 'Running…'}</span>
                                    </div>
                                )}
                                {runState === 'done' && runOutput && (
                                    <div className="mt-2 space-y-1">
                                        {runOutput.compileStderr && (
                                            <>
                                                <div className="text-amber-400">{t('compileError') || 'Compile error:'}</div>
                                                <pre className="text-red-400 whitespace-pre-wrap break-words">{runOutput.compileStderr}</pre>
                                            </>
                                        )}
                                        {runOutput.stdout && (
                                            <pre className="text-gray-200 whitespace-pre-wrap break-words">{runOutput.stdout}</pre>
                                        )}
                                        {runOutput.stderr && (
                                            <pre className="text-red-400 whitespace-pre-wrap break-words">{runOutput.stderr}</pre>
                                        )}
                                        {runOutput.error && (
                                            <pre className="text-red-400 whitespace-pre-wrap break-words">{runOutput.error}</pre>
                                        )}
                                        {!runOutput.error && (
                                            <div className={runOutput.exitCode === 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                {runOutput.exitCode === 0 ? '✓' : '✗'} {(t('exitedWithCode') || 'Exited with code')} {runOutput.exitCode}
                                                {typeof runOutput.durationMs === 'number' && (
                                                    <span className="text-gray-500"> ({runOutput.durationMs}ms)</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        {isWebProject && (
                            <div
                                className="flex-1 min-h-0"
                                style={{
                                    display:
                                        !previewFloating && consoleExpanded && bottomTab === 'preview'
                                            ? 'block'
                                            : 'none',
                                }}
                            >
                                <PreviewPane files={files} onFloatingChange={handleFloatingChange} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
