import { useState } from "react";
import { useTranslation } from "react-i18next";
import Editor from "@monaco-editor/react";
import {
  Code2,
  X,
  Plus,
  Trash2,
  FileCode,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Send,
  FlaskConical,
  Pencil,
  Check,
  AlertTriangle,
} from "lucide-react";
import NewFileModal from "./NewFileModal";
import {
  TESTS_LANGUAGES,
  TEST_TEMPLATES,
  monacoLanguageFromFilename,
} from "./fileLanguages";


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


const defaultStarterFiles = [
  { name: 'index.html', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Activity</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  \n  <script src="script.js"></script>\n</body>\n</html>' },
  { name: 'style.css', content: '/* Add your styles here */\n' },
  { name: 'script.js', content: '// Add your JavaScript here\n' },
];

function FileExplorer({ files, activeIndex, onSelect, onDelete, onRename, onAddClick, label }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (e, index, currentName) => {
    e.stopPropagation();
    setEditingIndex(index);
    setEditValue(currentName);
  };

  const handleEditConfirm = (e, index) => {
    e.stopPropagation();
    if (editValue.trim() && editValue.trim() !== files[index].name) {
      onRename(index, editValue.trim());
    }
    setEditingIndex(null);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter') handleEditConfirm(e, index);
    if (e.key === 'Escape') setEditingIndex(null);
  };

  return (
    <div className="w-56 bg-gray-900/50 border-r border-gray-700 flex flex-col shrink-0">
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        <button
          type="button"
          onClick={onAddClick}
          className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
          title="Add file"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {files.length === 0 && (
          <p className="text-xs text-gray-500 italic px-3 py-2">No files yet</p>
        )}
        {files.map((file, index) => (
          <div
            key={file.name}
            className={`group flex items-center justify-between px-3 py-2 cursor-pointer transition-all ${activeIndex === index
              ? 'bg-blue-500/10 border-l-2 border-blue-500'
              : 'hover:bg-gray-800/50 border-l-2 border-transparent'
              }`}
            onClick={() => {
               if (editingIndex !== index) onSelect(index);
            }}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FileCode className={`w-4 h-4 shrink-0 ${getFileIcon(file.name)}`} />
              {editingIndex === index ? (
                <input
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onBlur={(e) => handleEditConfirm(e, index)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-gray-800 text-white text-sm px-1 py-0.5 rounded outline-none border border-blue-500 w-full min-w-0"
                />
              ) : (
                <span className={`text-sm truncate ${activeIndex === index ? 'text-white' : 'text-gray-400'}`}>
                  {file.name}
                </span>
              )}
            </div>
            
            {editingIndex !== index && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ml-2">
                <button
                  type="button"
                  onClick={(e) => startEdit(e, index, file.name)}
                  className="p-1 text-gray-600 hover:text-blue-400 transition-all"
                  title="Rename file"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(index);
                  }}
                  className="p-1 text-gray-600 hover:text-red-400 transition-all"
                  title="Delete file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MonacoPane({ file, onContentChange }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-10 bg-gray-900/50 border-b border-gray-700 flex items-center px-4 shrink-0">
        {file ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
            <FileCode className={`w-4 h-4 ${getFileIcon(file.name)}`} />
            <span className="text-sm text-white">{file.name}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-500 italic">No file selected</span>
        )}
      </div>
      <div className="flex-1 min-h-0" dir="ltr">
        <Editor
          height="100%"
          language={monacoLanguageFromFilename(file?.name || '')}
          value={file?.content || ''}
          onChange={onContentChange}
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
    </div>
  );
}

function TestsLanguagePicker({ onPick }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-900/30">
      <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl mb-4">
        <FlaskConical className="w-8 h-8 text-purple-400" />
      </div>
      <h4 className="text-lg font-semibold text-white mb-2">Pick a test language</h4>
      <p className="text-sm text-gray-400 max-w-md mb-6">
        Tests run in a sandbox to gate hints. Pick the language for this activity's test suite — students' code will be checked against it.
      </p>
      <div className="grid grid-cols-3 gap-3 w-full max-w-md">
        {TESTS_LANGUAGES.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => onPick(l.id)}
            className="px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-purple-500/50 rounded-xl text-white text-sm font-medium transition-all"
          >
            {l.label}
            <p className="text-xs text-gray-500 mt-1 font-normal">{l.runtime}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function StarterCodeModal({
  isOpen,
  onClose,
  starterFiles,
  onStarterFilesChange,
  testFiles,
  onTestFilesChange,
  testsLanguage,
  onTestsLanguageChange,
  prompt,
  onPromptChange,
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('starter');
  const [starterIndex, setStarterIndex] = useState(0);
  const [testsIndex, setTestsIndex] = useState(0);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [promptExpanded, setPromptExpanded] = useState(true);

  if (!isOpen) return null;

  const isStarter = activeTab === 'starter';
  const currentFiles = isStarter ? starterFiles : testFiles;
  const currentIndex = isStarter ? starterIndex : testsIndex;
  const setCurrentIndex = isStarter ? setStarterIndex : setTestsIndex;
  const setCurrentFiles = isStarter ? onStarterFilesChange : onTestFilesChange;
  const activeFile = currentFiles[currentIndex];

  const handleFileContentChange = (content) => {
    const next = [...currentFiles];
    next[currentIndex] = { ...next[currentIndex], content };
    setCurrentFiles(next);
  };

  const handleConfirmNewFile = ({ filename }) => {
    if (currentFiles.some((f) => f.name === filename)) return;
    setCurrentFiles([...currentFiles, { name: filename, content: '' }]);
    setCurrentIndex(currentFiles.length);
    setShowNewFileModal(false);
  };

  const handleDeleteFile = (index) => {
    const next = currentFiles.filter((_, i) => i !== index);
    setCurrentFiles(next);
    if (currentIndex >= next.length) setCurrentIndex(Math.max(0, next.length - 1));
  };

  const getWarnings = () => {
    const warnings = [];
    if (!currentFiles || currentFiles.length === 0) return warnings;

    // Java Checks
    const javaFiles = currentFiles.filter(f => f.name.endsWith('.java'));
    if (javaFiles.length > 0) {
      javaFiles.forEach(f => {
        const match = f.content.match(/public\s+class\s+([a-zA-Z0-9_]+)/);
        if (match) {
          const expectedName = `${match[1]}.java`;
          if (f.name !== expectedName) {
            warnings.push(`Java Error: File "${f.name}" contains public class "${match[1]}". The file must be renamed to "${expectedName}".`);
          }
        }
      });
    }

    // Python Test Checks
    if (!isStarter && testsLanguage === 'python') {
      const hasTestFile = currentFiles.some(f => f.name.startsWith('test_') && f.name.endsWith('.py'));
      if (!hasTestFile) {
        warnings.push('Python: Test files must be named starting with "test_" (e.g. test_main.py).');
      }
      const hasUnittest = currentFiles.some(f => f.content.includes('import unittest'));
      if (!hasUnittest) {
        warnings.push('Python: Test files must use the "unittest" framework (import unittest).');
      }
    }

    // JS Test Checks
    if (!isStarter && testsLanguage === 'javascript') {
      const hasTestFile = currentFiles.some(f => f.name.endsWith('.test.js'));
      if (!hasTestFile) {
        warnings.push('JavaScript: Test files must be named ending with ".test.js" (e.g. main.test.js).');
      }
      const hasTestSyntax = currentFiles.some(f => f.content.includes('test(') || f.content.includes('it('));
      if (!hasTestSyntax) {
        warnings.push('JavaScript: Test files must use the test("name", () => {}) syntax.');
      }
    }

    return warnings;
  };

  const warnings = getWarnings();

  const handleRenameFile = (index, newName) => {
    if (currentFiles.some((f, i) => i !== index && f.name === newName)) return; // Prevent duplicate names
    const next = [...currentFiles];
    next[index] = { ...next[index], name: newName };
    setCurrentFiles(next);
  };

  const handlePickTestsLanguage = (langId) => {
    onTestsLanguageChange(langId);
    if (testFiles.length === 0) {
      onTestFilesChange((TEST_TEMPLATES[langId] || []).map((f) => ({ name: f.path, content: f.content })));
      setTestsIndex(0);
    }
  };

  const handleResetTestsLanguage = () => {
    if (!confirm("Clearing the tests language will remove all test files. Continue?")) return;
    onTestsLanguageChange(null);
    onTestFilesChange([]);
    setTestsIndex(0);
  };

  const showTestsPicker = !isStarter && (!testsLanguage || testFiles.length === 0);
  const newFileLockedLanguage = isStarter ? null : testsLanguage;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="relative bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-[95vw] h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Code2 className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white">{t('starterCodeEditor')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-gray-700 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('starter')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              isStarter
                ? 'text-white border-green-500 bg-gray-900/50'
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Starter Files
            <span className="text-xs text-gray-500">({starterFiles.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              !isStarter
                ? 'text-white border-purple-500 bg-gray-900/50'
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            Tests
            <span className="text-xs text-gray-500">({testFiles.length})</span>
          </button>
          {!isStarter && testsLanguage && (
            <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
              <span>
                Language: <span className="text-purple-300 font-medium">{TESTS_LANGUAGES.find((l) => l.id === testsLanguage)?.label}</span>
              </span>
              <button
                type="button"
                onClick={handleResetTestsLanguage}
                className="px-2 py-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {showTestsPicker ? (
            <TestsLanguagePicker onPick={handlePickTestsLanguage} />
          ) : (
            <>
              <FileExplorer
                files={currentFiles}
                activeIndex={currentIndex}
                onSelect={setCurrentIndex}
                onDelete={handleDeleteFile}
                onRename={handleRenameFile}
                onAddClick={() => setShowNewFileModal(true)}
                label={isStarter ? t('filesLabel') : 'Test files'}
              />

              <div className="flex-1 flex flex-col overflow-hidden">
                {warnings.length > 0 && (
                  <div className="bg-red-500/10 border-b border-red-500/20 p-3 shrink-0 flex flex-col gap-1.5 overflow-y-auto max-h-32">
                    {warnings.map((w, i) => (
                      <div key={i} className="text-red-400 text-xs flex items-start gap-2">
                         <AlertTriangle className="w-4 h-4 shrink-0" />
                         <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
                <MonacoPane file={activeFile} onContentChange={handleFileContentChange} />

                {isStarter && (
                  <div className={`border-t border-gray-700 bg-gray-900/50 flex flex-col transition-all duration-200 ${promptExpanded ? 'h-48' : 'h-10'}`}>
                    <button
                      type="button"
                      onClick={() => setPromptExpanded(!promptExpanded)}
                      className="h-10 flex items-center justify-between px-4 hover:bg-gray-800/50 transition-colors shrink-0"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-gray-300">{t('aiPrompt')}</span>
                      </div>
                      {promptExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-gray-600" />
                      )}
                    </button>

                    {promptExpanded && (
                      <div className="flex-1 p-4 overflow-hidden flex gap-3">
                        <textarea
                          value={prompt}
                          onChange={(e) => onPromptChange(e.target.value)}
                          placeholder="Describe what the AI should generate for the starter code..."
                          className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200 resize-none text-sm"
                        />
                        <button
                          type="button"
                          disabled={!prompt?.trim()}
                          className="self-end p-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-600 border border-purple-500 disabled:border-gray-700 rounded-xl text-white transition-colors disabled:cursor-not-allowed shrink-0"
                          title="Send prompt"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700 bg-gray-900/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-colors"
          >
            {t('done')}
          </button>
        </div>

        <NewFileModal
          isOpen={showNewFileModal}
          onClose={() => setShowNewFileModal(false)}
          onConfirm={handleConfirmNewFile}
          existingNames={currentFiles.map((f) => f.name)}
          lockedLanguageId={newFileLockedLanguage}
          title={isStarter ? "New starter file" : "New test file"}
        />
      </div>
    </div>
  );
}

export default function StarterCodeEditor({
  files,
  onFilesChange,
  prompt,
  onPromptChange,
  testFiles = [],
  onTestFilesChange = () => {},
  testsLanguage = null,
  onTestsLanguageChange = () => {},
}) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentFiles = files && files.length > 0 ? files : defaultStarterFiles;

  const handleOpenModal = () => {
    if (!files || files.length === 0) {
      onFilesChange(defaultStarterFiles);
    }
    setIsModalOpen(true);
  };

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
        <Code2 className="w-4 h-4 text-gray-500" />
        {t('starterCode')}
        <span className="text-gray-500 font-normal">{t('optional')}</span>
      </label>

      <button
        type="button"
        onClick={handleOpenModal}
        className="w-full px-4 py-4 bg-gray-900/50 border border-gray-600 rounded-xl text-left hover:border-green-500/50 hover:bg-gray-900/70 transition-all duration-200 group"
      >
        {currentFiles && currentFiles.length > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
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
              <div className="min-w-0">
                <p className="text-sm text-gray-300">
                  {currentFiles.length} {currentFiles.length !== 1 ? t('files') : t('file')}
                  {testFiles.length > 0 && (
                    <span className="ml-2 text-purple-300">
                      {"·"} {testFiles.length} test{testFiles.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {currentFiles.map(f => f.name).join(', ')}
                </p>
              </div>
            </div>
            {testsLanguage && (
              <span className="shrink-0 px-2 py-1 text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-lg">
                <FlaskConical className="w-3 h-3 inline mr-1" />
                {TESTS_LANGUAGES.find((l) => l.id === testsLanguage)?.label}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-gray-500">
            <Code2 className="w-5 h-5 group-hover:text-green-400 transition-colors" />
            <span className="group-hover:text-gray-400 transition-colors">{t('clickToAddStarterCode')}</span>
          </div>
        )}
      </button>

      <StarterCodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        starterFiles={currentFiles}
        onStarterFilesChange={onFilesChange}
        testFiles={testFiles}
        onTestFilesChange={onTestFilesChange}
        testsLanguage={testsLanguage}
        onTestsLanguageChange={onTestsLanguageChange}
        prompt={prompt}
        onPromptChange={onPromptChange}
      />
    </div>
  );
}
