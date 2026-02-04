import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const PLACEHOLDER_MESSAGES = [
    {
        role: 'assistant',
        content: `Hi! I'm your **IntelliTA** teaching assistant I can help you work through this activity.

Here's a quick example of code formatted using markdown:

\`\`\`java
public class Example {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
\`\`\`

Feel free to ask me for hints when you get stuck solving the lab!`
    },
    {
        role: 'assistant',
        content: `### Tips for this activity

1. **Read the instructions** carefully before writing code
2. Use the \`Verify Solution\` button at each checkpoint
3. Pay attention to the *method signatures* and *return types*

> Remember: understanding the problem is half the solution!`
    }
];

const markdownComponents = {
    h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2 pb-1 border-b border-gray-600">{children}</h1>,
    h2: ({ children }) => <h2 className="text-base font-semibold text-white mb-2 mt-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-sm font-semibold text-white mb-1 mt-2">{children}</h3>,
    p: ({ children }) => <p className="text-gray-300 mb-2 text-sm leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-2 space-y-0.5 ml-2 text-sm">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-2 space-y-0.5 ml-2 text-sm">{children}</ol>,
    li: ({ children }) => <li className="text-gray-300 text-sm">{children}</li>,
    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
    em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
    code: ({ children, className }) => {
        const isBlock = className?.includes('language-');
        if (isBlock) {
            return <code className="text-blue-300 text-xs font-mono">{children}</code>;
        }
        return (
            <code className="bg-gray-900/60 px-1 py-0.5 rounded text-blue-400 text-xs font-mono">{children}</code>
        );
    },
    pre: ({ children }) => (
        <pre className="bg-gray-900 p-3 rounded-lg overflow-x-auto mb-2 border border-gray-700 text-xs">{children}</pre>
    ),
    blockquote: ({ children }) => (
        <blockquote className="border-l-3 border-blue-500 pl-3 italic text-gray-400 mb-2 bg-gray-900/40 py-1 rounded-r text-sm">{children}</blockquote>
    ),
    a: ({ href, children }) => (
        <a href={href} className="text-blue-400 hover:underline text-sm" target="_blank" rel="noopener noreferrer">{children}</a>
    ),
};

const userMarkdownComponents = {
    h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2 pb-1 border-b border-blue-400/40">{children}</h1>,
    h2: ({ children }) => <h2 className="text-base font-semibold text-white mb-2 mt-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-sm font-semibold text-white mb-1 mt-2">{children}</h3>,
    p: ({ children }) => <p className="text-white mb-2 text-sm leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside text-white mb-2 space-y-0.5 ml-2 text-sm">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside text-white mb-2 space-y-0.5 ml-2 text-sm">{children}</ol>,
    li: ({ children }) => <li className="text-white text-sm">{children}</li>,
    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
    em: ({ children }) => <em className="italic text-blue-100">{children}</em>,
    code: ({ children, className }) => {
        const isBlock = className?.includes('language-');
        if (isBlock) {
            return <code className="text-blue-100 text-xs font-mono">{children}</code>;
        }
        return (
            <code className="bg-blue-700/50 px-1 py-0.5 rounded text-blue-100 text-xs font-mono">{children}</code>
        );
    },
    pre: ({ children }) => (
        <pre className="bg-blue-800/50 p-3 rounded-lg overflow-x-auto mb-2 border border-blue-400/30 text-xs">{children}</pre>
    ),
    blockquote: ({ children }) => (
        <blockquote className="border-l-3 border-blue-300 pl-3 italic text-blue-100 mb-2 bg-blue-800/30 py-1 rounded-r text-sm">{children}</blockquote>
    ),
    a: ({ href, children }) => (
        <a href={href} className="text-blue-100 underline hover:text-white text-sm" target="_blank" rel="noopener noreferrer">{children}</a>
    ),
};

export default function HintChatSidebar({ isOpen, onClose, initialInput, onInitialInputConsumed }) {
    const [messages, setMessages] = useState(PLACEHOLDER_MESSAGES);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isOpen, messages]);

    // Consume initialInput when it changes
    useEffect(() => {
        if (initialInput) {
            setInput(`I need help understanding this code:\n\`\`\`\n${initialInput}\n\`\`\``);
            onInitialInputConsumed?.();
            // Focus and select the prompt text so the user can type over it
            const promptLength = 'I need help understanding this code:'.length;
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.setSelectionRange(0, promptLength);
                }
            }, 50);
        }
    }, [initialInput, onInitialInputConsumed]);

    const handleSend = () => {
        const text = input.trim();
        if (!text) return;
        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setInput('');
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-30"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-10 right-0 bottom-0 w-[400px] bg-gray-900 border-l border-gray-700 z-40 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Header */}
                <div className="h-12 px-4 flex items-center justify-between border-b border-gray-700 shrink-0 bg-gray-900">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-sm font-semibold text-white">AI Assistant</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-xl px-4 py-3 ${
                                    msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-sm'
                                        : 'bg-gray-800 border border-gray-700 rounded-bl-sm'
                                }`}
                            >
                                <ReactMarkdown components={msg.role === 'assistant' ? markdownComponents : userMarkdownComponents}>
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="p-3 border-t border-gray-700 shrink-0 bg-gray-900">
                    <div className="flex items-start gap-2">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Ask for a hint..."
                            rows={input.includes('\n') ? Math.min(input.split('\n').length, 6) : 1}
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 transition-colors resize-none"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 border border-blue-500 disabled:border-gray-700 rounded-lg text-white transition-colors disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
