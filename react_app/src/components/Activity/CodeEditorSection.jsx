import Editor from "@monaco-editor/react";
import FileExplorer from './FileExplorer';
import { Terminal } from 'lucide-react';

export default function CodeEditorSection({
    files,
    activeFile,
    feedback,
    activeCheckpoint,
    onFileSelect,
    onFileChange
}) {
    return (
        <div className="flex-1 flex flex-col bg-[#1e1e1e]">
            <div className="h-10 border-b border-[#30363d] bg-[#0d1117] flex items-center px-2">
                <span className="text-xs font-bold text-gray-500 uppercase px-3">Sandbox</span>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-48 border-r border-[#30363d] bg-[#0d1117]">
                    <FileExplorer
                        files={files}
                        activeFile={activeFile}
                        onFileSelect={onFileSelect}
                    />
                </div>

                <div className="flex-1 flex flex-col relative overflow-hidden">
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
                            padding: { top: 10 },
                            scrollBeyondLastLine: false,
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        }}
                    />

                    <div className="h-32 border-t border-[#30363d] bg-[#0d1117] p-2 font-mono text-xs overflow-auto">
                        <div className="flex items-center gap-2 text-gray-500 mb-2 border-b border-gray-800 pb-1">
                            <Terminal className="w-3 h-3" />
                            <span>Console / Output</span>
                        </div>
                        <div className="text-gray-300">
                            {feedback ? `> ${feedback.message}` : "> Ready..."}
                            <br />
                            {activeCheckpoint ? `> Waiting for solution to: ${activeCheckpoint.title}...` : ""}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
