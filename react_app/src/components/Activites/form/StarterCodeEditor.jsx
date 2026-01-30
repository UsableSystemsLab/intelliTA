import { useState } from "react";
import Editor from "@monaco-editor/react";
import {
  Code2,
  X,
  Plus,
  Trash2,
  FileCode,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// Get language from file extension
const getLanguageFromFileName = (fileName) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const languageMap = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'rb': 'ruby',
    'php': 'php',
    'sql': 'sql',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
  };
  return languageMap[ext] || 'plaintext';
};

// Get file icon based on extension
const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const colors = {
    'js': 'text-yellow-400',
    'jsx': 'text-yellow-400',
    'ts': 'text-blue-400',
    'tsx': 'text-blue-400',
    'html': 'text-orange-400',
    'css': 'text-purple-400',
    'scss': 'text-pink-400',
    'json': 'text-yellow-300',
    'md': 'text-blue-300',
    'py': 'text-green-400',
    'java': 'text-red-400',
  };
  return colors[ext] || 'text-gray-400';
};

// Default starter files
const defaultFiles = [
  { name: 'index.html', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Activity</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  \n  <script src="script.js"></script>\n</body>\n</html>' },
  { name: 'style.css', content: '/* Add your styles here */\n' },
  { name: 'script.js', content: '// Add your JavaScript here\n' },
];

function StarterCodeModal({ isOpen, onClose, files, onFilesChange, prompt, onPromptChange }) {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [newFileName, setNewFileName] = useState('');
  const [showAddFile, setShowAddFile] = useState(false);
  const [promptExpanded, setPromptExpanded] = useState(true);

  if (!isOpen) return null;

  const activeFile = files[activeFileIndex];

  const handleFileContentChange = (content) => {
    const updatedFiles = [...files];
    updatedFiles[activeFileIndex] = { ...updatedFiles[activeFileIndex], content };
    onFilesChange(updatedFiles);
  };

  const handleAddFile = () => {
    if (!newFileName.trim()) return;
    const fileName = newFileName.includes('.') ? newFileName : `${newFileName}.js`;
    if (files.some(f => f.name === fileName)) {
      alert('A file with this name already exists');
      return;
    }
    onFilesChange([...files, { name: fileName, content: '' }]);
    setActiveFileIndex(files.length);
    setNewFileName('');
    setShowAddFile(false);
  };

  const handleDeleteFile = (index) => {
    if (files.length <= 1) {
      alert('You must have at least one file');
      return;
    }
    const updatedFiles = files.filter((_, i) => i !== index);
    onFilesChange(updatedFiles);
    if (activeFileIndex >= updatedFiles.length) {
      setActiveFileIndex(updatedFiles.length - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="relative bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-7xl h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Code2 className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Starter Code Editor</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-56 bg-gray-900/50 border-r border-gray-700 flex flex-col shrink-0">
            <div className="p-3 border-b border-gray-700 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Files</span>
              <button
                type="button"
                onClick={() => setShowAddFile(!showAddFile)}
                className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                title="Add file"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add File Input */}
            {showAddFile && (
              <div className="p-2 border-b border-gray-700 overflow-hidden">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="filename.js"
                    className="flex-1 min-w-0 px-2 py-1.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFile();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddFile}
                    className="shrink-0 px-2 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* File List */}
            <div className="flex-1 overflow-y-auto py-2">
              {files.map((file, index) => (
                <div
                  key={file.name}
                  className={`group flex items-center justify-between px-3 py-2 cursor-pointer transition-all ${
                    activeFileIndex === index
                      ? 'bg-blue-500/10 border-l-2 border-blue-500'
                      : 'hover:bg-gray-800/50 border-l-2 border-transparent'
                  }`}
                  onClick={() => setActiveFileIndex(index)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode className={`w-4 h-4 shrink-0 ${getFileIcon(file.name)}`} />
                    <span className={`text-sm truncate ${activeFileIndex === index ? 'text-white' : 'text-gray-400'}`}>
                      {file.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(index);
                    }}
                    className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Editor Section */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* File Tab */}
            <div className="h-10 bg-gray-900/50 border-b border-gray-700 flex items-center px-4 shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
                <FileCode className={`w-4 h-4 ${getFileIcon(activeFile?.name || '')}`} />
                <span className="text-sm text-white">{activeFile?.name}</span>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={getLanguageFromFileName(activeFile?.name || '')}
                value={activeFile?.content || ''}
                onChange={handleFileContentChange}
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
                  tabSize: 2,
                }}
              />
            </div>

            {/* AI Prompt Section */}
            <div className={`border-t border-gray-700 bg-gray-900/50 flex flex-col transition-all duration-200 ${promptExpanded ? 'h-48' : 'h-10'}`}>
              <button
                type="button"
                onClick={() => setPromptExpanded(!promptExpanded)}
                className="h-10 flex items-center justify-between px-4 hover:bg-gray-800/50 transition-colors shrink-0"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-gray-300">AI Prompt</span>
                  <span className="text-xs text-gray-500">(Coming Soon)</span>
                </div>
                {promptExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-gray-600" />
                )}
              </button>

              {promptExpanded && (
                <div className="flex-1 p-4 overflow-hidden">
                  <textarea
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    placeholder="Describe what the AI should generate for the starter code...

Example: Create a simple HTML page with a form that has name and email fields. Add basic CSS styling with a modern look. Include JavaScript to validate the form on submit."
                    className="w-full h-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200 resize-none text-sm"
                    disabled
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700 bg-gray-900/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StarterCodeEditor({ files, onFilesChange, prompt, onPromptChange }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize with default files if empty
  const currentFiles = files && files.length > 0 ? files : defaultFiles;

  const handleOpenModal = () => {
    if (!files || files.length === 0) {
      onFilesChange(defaultFiles);
    }
    setIsModalOpen(true);
  };

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
        <Code2 className="w-4 h-4 text-gray-500" />
        Starter Code
        <span className="text-gray-500 font-normal">(Optional)</span>
      </label>

      {/* Preview / Open Button */}
      <button
        type="button"
        onClick={handleOpenModal}
        className="w-full px-4 py-4 bg-gray-900/50 border border-gray-600 rounded-xl text-left hover:border-green-500/50 hover:bg-gray-900/70 transition-all duration-200 group"
      >
        {currentFiles && currentFiles.length > 0 ? (
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {currentFiles.slice(0, 3).map((file, i) => (
                <div
                  key={file.name}
                  className="w-8 h-8 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center"
                  style={{ zIndex: 3 - i }}
                >
                  <FileCode className={`w-4 h-4 ${getFileIcon(file.name)}`} />
                </div>
              ))}
              {currentFiles.length > 3 && (
                <div className="w-8 h-8 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center text-xs text-gray-400">
                  +{currentFiles.length - 3}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-300">
                {currentFiles.length} file{currentFiles.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-500">
                {currentFiles.map(f => f.name).join(', ')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-gray-500">
            <Code2 className="w-5 h-5 group-hover:text-green-400 transition-colors" />
            <span className="group-hover:text-gray-400 transition-colors">Click to add starter code files...</span>
          </div>
        )}
      </button>

      {/* Modal */}
      <StarterCodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        files={currentFiles}
        onFilesChange={onFilesChange}
        prompt={prompt}
        onPromptChange={onPromptChange}
      />
    </div>
  );
}
