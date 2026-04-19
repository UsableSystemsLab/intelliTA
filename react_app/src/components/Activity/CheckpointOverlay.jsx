import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { CheckCircle, FastForward, Code2, Lightbulb, Loader2, HelpCircle, ToggleLeft, PenLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const mdComponents = {
    h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2">{children}</h1>,
    h2: ({ children }) => <h2 className="text-base font-semibold text-white mb-2">{children}</h2>,
    h3: ({ children }) => <h3 className="text-sm font-semibold text-white mb-1">{children}</h3>,
    p: ({ children }) => <p className="text-gray-400 mb-2 leading-relaxed text-sm">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside text-gray-400 mb-2 space-y-0.5 text-sm">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside text-gray-400 mb-2 space-y-0.5 text-sm">{children}</ol>,
    li: ({ children }) => <li className="text-gray-400">{children}</li>,
    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
    em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
    code: ({ children, className }) => {
        const isBlock = className?.includes("language-");
        if (isBlock) return <code className="text-blue-300 text-xs font-mono">{children}</code>;
        return <code className="bg-gray-700 px-1 py-0.5 rounded text-blue-400 text-xs font-mono">{children}</code>;
    },
    pre: ({ children }) => (
        <pre className="bg-gray-900 p-3 rounded-lg overflow-x-auto mb-2 border border-gray-700 text-xs">{children}</pre>
    ),
    blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-blue-500 pl-3 italic text-gray-400 mb-2 bg-gray-900/50 py-1 rounded-r text-sm">{children}</blockquote>
    ),
    hr: () => <hr className="border-gray-700 my-3" />,
};

// --- Sub-components for each quiz type ---

function McqBody({ checkpoint, onSubmit }) {
    const { t } = useTranslation();
    const [selected, setSelected] = useState(null);

    useEffect(() => { setSelected(null); }, [checkpoint.id]);

    return (
        <>
            <div className="text-gray-400 mb-5 text-sm leading-relaxed text-left">
                <ReactMarkdown components={mdComponents}>{checkpoint.question || ''}</ReactMarkdown>
            </div>
            <div className="flex flex-col gap-2 mb-5 text-left">
                {checkpoint.options.map((option, idx) => (
                    <button
                        key={idx}
                        onClick={() => setSelected(idx)}
                        className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all border text-left flex items-start gap-3 ${
                            selected === idx
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                                : 'bg-gray-700/40 text-gray-300 border-gray-600/50 hover:bg-gray-700/70'
                        }`}
                    >
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-600/50 text-xs font-bold shrink-0 mt-0.5">
                            {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="min-w-0 [&>p]:mb-0 [&>p:last-child]:mb-0">
                            <ReactMarkdown components={mdComponents}>{option || ''}</ReactMarkdown>
                        </span>
                    </button>
                ))}
            </div>
            <button
                onClick={() => selected !== null && onSubmit(selected)}
                disabled={selected === null}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <CheckCircle className="w-5 h-5" />
                {t('submitAnswer')}
            </button>
        </>
    );
}

function TrueFalseBody({ checkpoint, onSubmit }) {
    const { t } = useTranslation();
    return (
        <>
            <div className="text-gray-400 mb-5 text-sm leading-relaxed text-left">
                <ReactMarkdown components={mdComponents}>{checkpoint.question || ''}</ReactMarkdown>
            </div>
            <div className="flex gap-3 mb-2">
                <button
                    onClick={() => onSubmit(true)}
                    className="flex-1 py-3 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-xl transition-all border border-emerald-500/30 flex items-center justify-center gap-2"
                >
                    <CheckCircle className="w-5 h-5" />
                    {t('trueLabel')}
                </button>
                <button
                    onClick={() => onSubmit(false)}
                    className="flex-1 py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-xl transition-all border border-red-500/30 flex items-center justify-center gap-2"
                >
                    <FastForward className="w-5 h-5" />
                    {t('falseLabel')}
                </button>
            </div>
        </>
    );
}

function FillBlankBody({ checkpoint, onSubmit }) {
    const { t } = useTranslation();
    const [answer, setAnswer] = useState('');

    useEffect(() => { setAnswer(''); }, [checkpoint.id]);

    return (
        <>
            <div className="text-gray-400 mb-5 text-sm leading-relaxed text-left">
                <ReactMarkdown components={mdComponents}>{checkpoint.question || ''}</ReactMarkdown>
            </div>
            <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && answer.trim() && onSubmit(answer)}
                placeholder="Type your answer..."
                className="w-full py-3 px-4 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 mb-4"
            />
            <button
                onClick={() => answer.trim() && onSubmit(answer)}
                disabled={!answer.trim()}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <CheckCircle className="w-5 h-5" />
                {t('submitAnswer')}
            </button>
        </>
    );
}

function ChallengeBody({ checkpoint, onCheckSolution }) {
    const { t } = useTranslation();
    return (
        <>
            <div className="text-gray-400 mb-6 text-sm leading-relaxed text-left">
                <ReactMarkdown components={mdComponents}>{checkpoint.instruction || ''}</ReactMarkdown>
            </div>
            <button
                onClick={onCheckSolution}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            >
                <CheckCircle className="w-5 h-5" />
                {t('verifySolution')}
            </button>
        </>
    );
}

// --- Icon & label per type ---

const TYPE_CONFIG = {
    challenge: { icon: Code2, label: 'Coding Challenge', color: 'blue' },
    mcq:       { icon: HelpCircle, label: 'Multiple Choice', color: 'blue' },
    true_false:{ icon: ToggleLeft, label: 'True or False', color: 'blue' },
    fill_blank:{ icon: PenLine, label: 'Fill in the Blank', color: 'blue' },
};

// --- Main overlay ---

export default function CheckpointOverlay({
    activeCheckpoint,
    feedback,
    onCheckSolution,
    onSubmitQuizAnswer,
    onSkip,
    onHint,
    hintText,
    isLoadingHint
}) {
    const { t } = useTranslation();

    if (!activeCheckpoint) return null;

    const type = activeCheckpoint.type;
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.challenge;
    const Icon = config.icon;

    return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-200 bg-black/50 backdrop-blur-sm">
            <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-500/30">
                        <Icon className="w-7 h-7" />
                    </div>

                    <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full mb-3 border border-blue-500/30">
                        {config.label}
                    </span>

                    {/* Title — challenge/coding uses title, quiz types use question as body */}
                    {(type === 'challenge') && (
                        <h2 className="text-xl font-bold text-white mb-3">
                            {activeCheckpoint.title}
                        </h2>
                    )}
                    {(type === 'mcq' || type === 'true_false' || type === 'fill_blank') && activeCheckpoint.title && (
                        <h2 className="text-xl font-bold text-white mb-3">
                            {activeCheckpoint.title}
                        </h2>
                    )}

                    {/* Type-specific body */}
                    {type === 'challenge' && (
                        <ChallengeBody checkpoint={activeCheckpoint} onCheckSolution={onCheckSolution} />
                    )}
                    {type === 'mcq' && (
                        <McqBody checkpoint={activeCheckpoint} onSubmit={onSubmitQuizAnswer} />
                    )}
                    {type === 'true_false' && (
                        <TrueFalseBody checkpoint={activeCheckpoint} onSubmit={onSubmitQuizAnswer} />
                    )}
                    {type === 'fill_blank' && (
                        <FillBlankBody checkpoint={activeCheckpoint} onSubmit={onSubmitQuizAnswer} />
                    )}

                    {/* Shared buttons: Hint + Skip */}
                    <div className="flex flex-col gap-3 mt-3">
                        {(type === 'challenge' || activeCheckpoint.hint) && (
                            <button
                                onClick={onHint}
                                disabled={isLoadingHint}
                                className="w-full py-2.5 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoadingHint ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Lightbulb className="w-4 h-4" />
                                )}
                                {isLoadingHint ? 'Generating Hint...' : t('hint')}
                            </button>
                        )}

                        <button
                            onClick={onSkip}
                            className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-500/30"
                        >
                            <FastForward className="w-4 h-4" />
                            {t('skip')}
                        </button>
                    </div>

                    {hintText && (
                        <div className="mt-4 p-3 rounded-xl text-sm text-left bg-amber-500/10 text-amber-200 border border-amber-500/30">
                            <div className="flex items-center gap-2 mb-1.5 text-amber-400 font-semibold">
                                <Lightbulb className="w-4 h-4" />
                                {t('hint')}
                            </div>
                            {hintText}
                        </div>
                    )}

                    {feedback && (
                        <div className={`mt-4 p-3 rounded-xl text-sm font-medium ${
                            feedback.type === 'success'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>
                            {feedback.message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
