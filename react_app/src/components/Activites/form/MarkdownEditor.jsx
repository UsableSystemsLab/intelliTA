import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import {
  FileText, X, Edit3, Eye, Bold, Italic, List, ListOrdered,
  Link, Code, Quote, Heading1, Heading2, Heading3, ChevronDown,
  Image, Minus, HelpCircle, GripVertical
} from "lucide-react";

function MarkdownModal({ isOpen, onClose, value, onChange }) {
  const { t } = useTranslation();
  const textareaRef = useRef(null);
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const [dragging, setDragging] = useState(false);

  const handleDividerMouseDown = () => {
    isDragging.current = true;
    setDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    setLeftWidth(Math.min(Math.max(newWidth, 20), 80));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    setDragging(false);
  };

  const insertFormatting = (before, after = "", placeholder = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;

    const newValue =
      value.substring(0, start) +
      before + textToInsert + after +
      value.substring(end);

    onChange(newValue);

    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length + after.length;
      textarea.setSelectionRange(
        selectedText ? newCursorPos : start + before.length,
        selectedText ? newCursorPos : start + before.length + placeholder.length
      );
    }, 0);
  };

  const insertAtLineStart = (prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;

    const newValue =
      value.substring(0, lineStart) +
      prefix +
      value.substring(lineStart);

    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const toolbarButtons = [
    {
      type: 'dropdown',
      icon: <span className="text-sm font-semibold">{"Tt"}</span>,
      label: 'Headings',
      show: showHeadingMenu,
      setShow: setShowHeadingMenu,
      items: [
        { label: 'Heading 1', icon: <Heading1 className="w-4 h-4" />, action: () => insertAtLineStart('# ') },
        { label: 'Heading 2', icon: <Heading2 className="w-4 h-4" />, action: () => insertAtLineStart('## ') },
        { label: 'Heading 3', icon: <Heading3 className="w-4 h-4" />, action: () => insertAtLineStart('### ') },
      ]
    },
    { type: 'divider' },
    { type: 'button', icon: <Bold className="w-4 h-4" />, label: 'Bold', action: () => insertFormatting('**', '**', 'bold text') },
    { type: 'button', icon: <Italic className="w-4 h-4" />, label: 'Italic', action: () => insertFormatting('*', '*', 'italic text') },
    { type: 'divider' },
    {
      type: 'dropdown',
      icon: <List className="w-4 h-4" />,
      label: 'Lists',
      show: showListMenu,
      setShow: setShowListMenu,
      items: [
        { label: 'Bullet List', icon: <List className="w-4 h-4" />, action: () => insertAtLineStart('- ') },
        { label: 'Numbered List', icon: <ListOrdered className="w-4 h-4" />, action: () => insertAtLineStart('1. ') },
      ]
    },
    { type: 'divider' },
    { type: 'button', icon: <Link className="w-4 h-4" />, label: 'Link', action: () => insertFormatting('[', '](url)', 'link text') },
    { type: 'button', icon: <Image className="w-4 h-4" />, label: 'Image', action: () => insertFormatting('![', '](image-url)', 'alt text') },
    { type: 'divider' },
    { type: 'button', icon: <Code className="w-4 h-4" />, label: 'Inline Code', action: () => insertFormatting('`', '`', 'code') },
    { type: 'button', icon: <Quote className="w-4 h-4" />, label: 'Quote', action: () => insertAtLineStart('> ') },
    { type: 'button', icon: <Minus className="w-4 h-4" />, label: 'Horizontal Rule', action: () => insertFormatting('\n---\n', '', '') },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="relative bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-[95vw] h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white">{t('markdownEditor')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Side by Side */}
        <div
          ref={containerRef}
          className={`flex-1 flex overflow-hidden ${dragging ? "cursor-col-resize select-none" : ""}`}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Write Section */}
          <div className="flex flex-col overflow-hidden" style={{ width: `${leftWidth}%` }}>
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-900/50 border-b border-gray-700">
              <Edit3 className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-300">{t('write')}</span>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-1 px-3 py-2 bg-gray-800/80 border-b border-gray-700 flex-wrap">
              {toolbarButtons.map((item, index) => {
                if (item.type === 'divider') {
                  return <div key={index} className="w-px h-5 bg-gray-600 mx-1" />;
                }

                if (item.type === 'dropdown') {
                  return (
                    <div key={index} className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          item.setShow(!item.show);
                          // Close other dropdowns
                          if (item.label === 'Headings') setShowListMenu(false);
                          if (item.label === 'Lists') setShowHeadingMenu(false);
                        }}
                        className="flex items-center gap-1 px-2 py-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                        title={item.label}
                      >
                        {item.icon}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {item.show && (
                        <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-10 min-w-[150px]">
                          {item.items.map((subItem, subIndex) => (
                            <button
                              key={subIndex}
                              type="button"
                              onClick={() => {
                                subItem.action();
                                item.setShow(false);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
                            >
                              {subItem.icon}
                              {subItem.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={item.action}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    title={item.label}
                  >
                    {item.icon}
                  </button>
                );
              })}

              {/* Right side - Help */}
              <div className="flex-1" />
              <button
                type="button"
                className="p-1.5 text-gray-500 hover:text-gray-300 rounded transition-colors"
                title="Markdown Help"
                onClick={() => window.open('https://www.markdownguide.org/basic-syntax/', '_blank')}
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Write your markdown content here...

# Example Header

## Subheader

- List item 1
- List item 2

**Bold text** and *italic text*

\`inline code\`

```
code block
```"
              className="flex-1 w-full px-4 py-4 bg-gray-900/30 text-white placeholder-gray-500 focus:outline-none resize-none font-mono text-sm"
            />
          </div>

          {/* Draggable divider */}
          <div
            onMouseDown={handleDividerMouseDown}
            className={`w-3 shrink-0 cursor-col-resize flex items-center justify-center group transition-colors ${
              dragging ? "bg-blue-500/40" : "bg-gray-600/60 hover:bg-blue-500/40"
            }`}
          >
            <div className={`w-1 h-12 rounded-full transition-all ${
              dragging ? "bg-blue-400 opacity-100" : "bg-gray-400 opacity-60 group-hover:bg-blue-400 group-hover:opacity-100"
            }`} />
          </div>

          {/* Preview Section */}
          <div className="flex flex-col overflow-hidden" style={{ width: `${100 - leftWidth}%` }}>
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-900/50 border-b border-gray-700">
              <Eye className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-gray-300">{t('preview')}</span>
            </div>
            <div className="flex-1 px-6 py-4 bg-gray-900/30 overflow-y-auto">
              {value ? (
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4 pb-2 border-b border-gray-700">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-semibold text-white mb-3 mt-6">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold text-white mb-2 mt-4">{children}</h3>,
                    p: ({ children }) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-1">{children}</ol>,
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
                    img: ({ src, alt }) => (
                      <img
                        src={src}
                        alt={alt}
                        className="max-w-full h-auto rounded-lg my-4 border border-gray-700"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling && (e.target.nextSibling.style.display = 'block');
                        }}
                      />
                    ),
                  }}
                >
                  {value}
                </ReactMarkdown>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <FileText className="w-12 h-12 mb-3 opacity-50" />
                  <p className="italic">{t('previewWillAppearHere')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700 bg-gray-900/50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
          >
            {t('done')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MarkdownEditor({ value, onChange, label = "Markdown Content" }) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
        <FileText className="w-4 h-4 text-gray-500" />
        {label}
        <span className="text-gray-500 font-normal">{t('optional')}</span>
      </label>

      {/* Preview / Open Button */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full px-4 py-4 bg-gray-900/50 border border-gray-600 rounded-xl text-left hover:border-blue-500/50 hover:bg-gray-900/70 transition-all duration-200 group"
      >
        {value ? (
          <div className="text-gray-300 text-sm line-clamp-3 font-mono">
            {value.substring(0, 150)}{value.length > 150 ? "..." : ""}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-gray-500">
            <Edit3 className="w-5 h-5 group-hover:text-blue-400 transition-colors" />
            <span className="group-hover:text-gray-400 transition-colors">{t('clickToWriteMarkdown')}</span>
          </div>
        )}
      </button>

      {/* Modal */}
      <MarkdownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
