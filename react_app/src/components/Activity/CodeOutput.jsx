import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

export default function CodeOutput({
  value = '',
  language = 'plaintext',
  height = '400px',
  theme = "vs-dark",
  options = {},
}) {
  const [editorValue, setEditorValue] = useState(value);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  const handleEditorDidMount = (editor, monaco) => {
    console.log('✅ Code Output Editor mounted successfully!');
    setIsReady(true);

    // Configure custom theme
    monaco.editor.defineTheme('custom-dark-output', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
      ],
      colors: {
        'editor.background': '#0f172a',
        'editor.foreground': '#e2e8f0',
        'editorLineNumber.foreground': '#64748b',
        'editor.selectionBackground': '#334155',
        'editor.lineHighlightBackground': '#0f172a',
      }
    });
  };

  const beforeMount = (monaco) => {
    console.log('Code Output Monaco is being loaded...');
  };

  const defaultOptions = {
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    minimap: { enabled: false },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    lineNumbers: 'on',
    folding: false,
    lineDecorationsWidth: 10,
    lineNumbersMinChars: 3,
    renderLineHighlight: 'none',
    cursorBlinking: 'solid',
    smoothScrolling: true,
    padding: { top: 10, bottom: 10 },
    scrollbar: {
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
      useShadows: false,
    },
    readOnly: true,
    domReadOnly: true,
    contextmenu: false,
    ...options,
  };

  const LoadingScreen = () => (
    <div
      className="flex items-center justify-center bg-slate-900 rounded"
      style={{ height }}
    >
      <div className="text-center text-white">
        <div className="relative w-12 h-12 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-sm font-medium">Loading Output Panel...</p>
        <p className="text-xs text-gray-400 mt-2">Initializing output viewer</p>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-900 rounded-lg shadow-xl overflow-hidden border border-slate-700">
      {/* Header Bar */}
      <div className="bg-slate-950 px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-3">
          {/* Mac-style window controls */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-slate-600"></div>
            <div className="w-3 h-3 rounded-full bg-slate-600"></div>
            <div className="w-3 h-3 rounded-full bg-slate-600"></div>
          </div>

          {/* Output indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
              Output
            </span>
            {editorValue && (
              <span className="text-xs text-gray-500">
                • {editorValue.split('\n').length} lines
              </span>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {isReady ? (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Ready
            </span>
          ) : (
            <span className="text-xs text-yellow-400 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
              Loading...
            </span>
          )}
        </div>
      </div>

      {/* Editor Container */}
      <div className="bg-slate-900">
        <Editor
          height={height}
          language={language}
          value={editorValue}
          theme={theme}
          options={defaultOptions}
          onMount={handleEditorDidMount}
          beforeMount={beforeMount}
          loading={<LoadingScreen />}
        />
      </div>
    </div>
  );
}
