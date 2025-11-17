import CodeInput from './CodeInput';

export default function EditorSection({ code, onChange, onRun, isRunning }) {
    return (
        <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
                
                <button
                    onClick={onRun}
                    disabled={isRunning}
                    className={`
                        flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold
                        transition-all duration-200 shadow-lg
                        ${isRunning
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                        }
                        text-white
                    `}
                >
                    {isRunning ? (
                        <>
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Running...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Run Code
                        </>
                    )}
                </button>
            </div>
            <CodeInput
                language="java"
                height="450px"
                value={code}
                onChange={onChange}
            />
        </div>
    );
}
