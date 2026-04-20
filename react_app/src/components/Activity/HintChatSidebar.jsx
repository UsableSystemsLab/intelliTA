import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, Loader2, Square, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { API_BASE as NODE_API_URL, LLM_BASE as LLM_SERVER_URL, getAuthHeaders } from '../../config/api';
import { auth } from '@/utils/firebase.js';
import useTTS, { TTS_ENABLED_KEY } from '@/utils/useTTS.js';

const LOCAL_MODELS = [
    { id: 'qwen2.5-coder:7b', label: 'Qwen Coder' },
    { id: 'codellama:7b', label: 'Code Llama' },
];

const WELCOME_MESSAGE = {
    role: 'assistant',
    content: `Hi! I'm your **IntelliTA** teaching assistant. I can help you work through this activity.

Feel free to ask me for hints when you get stuck solving the lab!`,
};

const markdownComponents = {
    h1: ({ children }) => <h1 className="text-xl font-bold text-white mb-2 pb-1 border-b border-gray-600">{children}</h1>,
    h2: ({ children }) => <h2 className="text-lg font-semibold text-white mb-2 mt-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-base font-semibold text-white mb-1 mt-2">{children}</h3>,
    p: ({ children }) => <p className="text-gray-300 mb-2 text-base leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-2 space-y-0.5 ml-2 text-base">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-2 space-y-0.5 ml-2 text-base">{children}</ol>,
    li: ({ children }) => <li className="text-gray-300 text-base">{children}</li>,
    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
    em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
    code: ({ children, className }) => {
        const isBlock = className?.includes('language-');
        if (isBlock) {
            return <code className="text-blue-300 text-sm font-mono">{children}</code>;
        }
        return (
            <code className="bg-gray-900/60 px-1 py-0.5 rounded text-blue-400 text-sm font-mono">{children}</code>
        );
    },
    pre: ({ children }) => (
        <pre className="bg-gray-900 p-3 rounded-lg mb-2 border border-gray-700 text-sm whitespace-pre-wrap break-words">{children}</pre>
    ),
    blockquote: ({ children }) => (
        <blockquote className="border-l-3 border-blue-500 pl-3 italic text-gray-400 mb-2 bg-gray-900/40 py-1 rounded-r text-base">{children}</blockquote>
    ),
    a: ({ href, children }) => (
        <a href={href} className="text-blue-400 hover:underline text-base" target="_blank" rel="noopener noreferrer">{children}</a>
    ),
};

const userMarkdownComponents = {
    h1: ({ children }) => <h1 className="text-xl font-bold text-white mb-2 pb-1 border-b border-blue-400/40">{children}</h1>,
    h2: ({ children }) => <h2 className="text-lg font-semibold text-white mb-2 mt-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-base font-semibold text-white mb-1 mt-2">{children}</h3>,
    p: ({ children }) => <p className="text-white mb-2 text-base leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside text-white mb-2 space-y-0.5 ml-2 text-base">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside text-white mb-2 space-y-0.5 ml-2 text-base">{children}</ol>,
    li: ({ children }) => <li className="text-white text-base">{children}</li>,
    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
    em: ({ children }) => <em className="italic text-blue-100">{children}</em>,
    code: ({ children, className }) => {
        const isBlock = className?.includes('language-');
        if (isBlock) {
            return <code className="text-blue-100 text-sm font-mono">{children}</code>;
        }
        return (
            <code className="bg-blue-700/50 px-1 py-0.5 rounded text-blue-100 text-sm font-mono">{children}</code>
        );
    },
    pre: ({ children }) => (
        <pre className="bg-blue-800/50 p-3 rounded-lg mb-2 border border-blue-400/30 text-sm whitespace-pre-wrap break-words">{children}</pre>
    ),
    blockquote: ({ children }) => (
        <blockquote className="border-l-3 border-blue-300 pl-3 italic text-blue-100 mb-2 bg-blue-800/30 py-1 rounded-r text-base">{children}</blockquote>
    ),
    a: ({ href, children }) => (
        <a href={href} className="text-blue-100 underline hover:text-white text-base" target="_blank" rel="noopener noreferrer">{children}</a>
    ),
};

function TTSButton({ text, onSpeakStart }) {
    const { speak, stop, isSpeaking, isSupported } = useTTS(text);
    const ttsEnabled = localStorage.getItem(TTS_ENABLED_KEY) !== 'false';

    if (!isSupported || !ttsEnabled) return null;

    const handleClick = () => {
        if (isSpeaking) {
            stop();
        } else {
            onSpeakStart?.();
            speak();
        }
    };

    return (
        <button
            onClick={handleClick}
            className="mt-1 p-1 rounded hover:bg-gray-700/50 text-gray-500 hover:text-gray-300 transition-colors"
            title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
        >
            {isSpeaking
                ? <VolumeX className="w-3.5 h-3.5" />
                : <Volume2 className="w-3.5 h-3.5" />
            }
        </button>
    );
}

export default function HintChatSidebar({ isOpen, onClose, initialInput, onInitialInputConsumed, user, activityId, activityContext }) {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([WELCOME_MESSAGE]);
    const [input, setInput] = useState('');
    const [availableModels, setAvailableModels] = useState(LOCAL_MODELS);
    const [selectedModel, setSelectedModel] = useState(LOCAL_MODELS[0].id);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Fetch external models when sidebar opens
    useEffect(() => {
        if (!isOpen || !user?.uid) return;

        async function loadExternalModels() {
            try {
                const res = await fetch(`${NODE_API_URL}/users/${user.uid}/api-keys`, {
                    headers: await getAuthHeaders(auth.currentUser),
                });
                if (res.ok) {
                    const keys = await res.json();
                    const externalModels = keys.map((k) => ({
                        id: `external-${k.id}`,
                        label: `${k.model_name} (${k.label})`,
                        isExternal: true,
                        externalId: k.id,
                    }));
                    setAvailableModels([...LOCAL_MODELS, ...externalModels]);
                }
            } catch (err) {
                console.error('Failed to load external models:', err);
            }
        }
        loadExternalModels();
    }, [isOpen, user?.uid]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isOpen, messages]);

    // Load history when sidebar opens
    useEffect(() => {
        if (!isOpen || historyLoaded || !user?.uid || !activityId) return;

        async function loadHistory() {
            setIsLoadingHistory(true);
            try {
                const res = await fetch(
                    `${LLM_SERVER_URL}/hint/history?firebase_uid=${encodeURIComponent(user.uid)}&activity_id=${activityId}`
                );
                if (res.ok) {
                    const history = await res.json();
                    if (history.length > 0) {
                        setMessages([WELCOME_MESSAGE, ...history]);
                    }
                }
            } catch (err) {
                console.error('Failed to load chat history:', err);
            } finally {
                setIsLoadingHistory(false);
                setHistoryLoaded(true);
            }
        }
        loadHistory();
    }, [isOpen, historyLoaded, user, activityId]);

    // Consume initialInput when it changes
    useEffect(() => {
        if (initialInput) {
            setInput(`I need help understanding this code:\n\`\`\`\n${initialInput}\n\`\`\``);
            onInitialInputConsumed?.();
            const promptLength = 'I need help understanding this code:'.length;
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.setSelectionRange(0, promptLength);
                }
            }, 50);
        }
    }, [initialInput, onInitialInputConsumed]);

    const handleSend = useCallback(async () => {
        const text = input.trim();
        if (!text || isStreaming) return;

        if (!user?.uid || !activityId) {
            setMessages(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: 'Please log in to use the AI assistant.' }]);
            setInput('');
            return;
        }

        // Add user message and empty assistant message for streaming
        setMessages(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: '', isStreaming: true }]);
        setInput('');
        setIsStreaming(true);

        // Abort any previous request
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Determine if external model is selected
        const currentModel = availableModels.find((m) => m.id === selectedModel);
        const isExternal = currentModel?.isExternal;

        try {
            const body = {
                firebase_uid: user.uid,
                activity_id: parseInt(activityId),
                message: text,
                activity_context: activityContext || null,
            };

            if (isExternal) {
                body.external_key_id = currentModel.externalId;
            } else {
                body.model = selectedModel;
            }

            const res = await fetch(`${LLM_SERVER_URL}/hint/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            if (!res.ok) {
                throw new Error(`Server error: ${res.status}`);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data: ')) continue;
                    const payload = trimmed.slice(6);

                    if (payload === '[DONE]') break;

                    try {
                        const parsed = JSON.parse(payload);
                        if (parsed.error) {
                            setMessages(prev => {
                                const updated = [...prev];
                                updated[updated.length - 1] = {
                                    role: 'assistant',
                                    content: `Error: ${parsed.error}`,
                                };
                                return updated;
                            });
                            break;
                        }
                        if (parsed.token) {
                            setMessages(prev => {
                                const updated = [...prev];
                                const last = updated[updated.length - 1];
                                updated[updated.length - 1] = {
                                    ...last,
                                    content: last.content + parsed.token,
                                };
                                return updated;
                            });
                        }
                    } catch {
                        // skip malformed JSON
                    }
                }
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                setMessages(prev => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.isStreaming && !last.content) {
                        updated[updated.length - 1] = {
                            role: 'assistant',
                            content: 'Sorry, I couldn\'t connect to the AI service. Please try again later.',
                        };
                    }
                    return updated;
                });
            }
        } finally {
            // Remove isStreaming flag from the last message
            setMessages(prev => {
                const updated = [...prev];
                if (updated.length > 0) {
                    const last = updated[updated.length - 1];
                    if (last.isStreaming) {
                        updated[updated.length - 1] = { role: last.role, content: last.content };
                    }
                }
                return updated;
            });
            setIsStreaming(false);
        }
    }, [input, isStreaming, user, activityId, activityContext, selectedModel, availableModels]);

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
                className={`fixed top-10 right-0 bottom-0 w-[500px] bg-gray-900 border-l border-gray-700 z-40 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Header */}
                <div className="h-12 px-4 flex items-center justify-between border-b border-gray-700 shrink-0 bg-gray-900">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-base font-semibold text-white">{t('aiAssistant')}</span>
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
                    {isLoadingHistory ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                            <span className="ml-2 text-sm text-gray-400">{t('loadingConversation')}</span>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className="max-w-[85%]">
                                    <div
                                        className={`rounded-xl px-4 py-3 ${
                                            msg.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-br-sm'
                                                : 'bg-gray-800 border border-gray-700 rounded-bl-sm'
                                        }`}
                                    >
                                        {msg.isStreaming && !msg.content ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                                                <span className="text-base text-gray-400">{t('thinking')}</span>
                                            </div>
                                        ) : (
                                            <ReactMarkdown components={msg.role === 'assistant' ? markdownComponents : userMarkdownComponents}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        )}
                                    </div>
                                    {msg.role === 'assistant' && !msg.isStreaming && msg.content && (
                                        <TTSButton
                                            text={msg.content}
                                            onSpeakStart={() => window.speechSynthesis.cancel()}
                                        />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="p-3 border-t border-gray-700 shrink-0 bg-gray-900">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Ask for a hint..."
                        rows={input.includes('\n') ? Math.min(input.split('\n').length, 6) : 1}
                        disabled={isStreaming}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-base text-white placeholder-gray-500 outline-none focus:border-blue-500 transition-colors resize-none disabled:opacity-50 mb-2"
                    />
                    <div className="flex items-center justify-between">
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-2 py-1 outline-none focus:border-blue-500 transition-colors cursor-pointer"
                        >
                            {availableModels.some((m) => !m.isExternal) && (
                                <optgroup label="Local Models">
                                    {availableModels.filter((m) => !m.isExternal).map((m) => (
                                        <option key={m.id} value={m.id}>{m.label}</option>
                                    ))}
                                </optgroup>
                            )}
                            {availableModels.some((m) => m.isExternal) && (
                                <optgroup label="External Models">
                                    {availableModels.filter((m) => m.isExternal).map((m) => (
                                        <option key={m.id} value={m.id}>{m.label}</option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                        {isStreaming ? (
                            <button
                                onClick={() => abortControllerRef.current?.abort()}
                                className="p-2 bg-red-600 hover:bg-red-500 border border-red-500 rounded-lg text-white transition-colors"
                                title="Stop generating"
                            >
                                <Square className="w-4 h-4 fill-current" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 border border-blue-500 disabled:border-gray-700 rounded-lg text-white transition-colors disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}