import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Trophy, Home, ArrowRight, Award, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function TestResultRow({ result }) {
    const passed = !!result.passed;
    const label = result.name || result.test_case_name || `Test #${result.test_case_id}`;
    return (
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div className="flex items-center gap-3 min-w-0">
                <div className={`w-2 h-2 rounded-full ${passed ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium text-gray-200 truncate">{label}</span>
                {result.points_awarded > 0 && (
                    <span className="text-[10px] font-mono font-semibold text-emerald-300">
                        +{result.points_awarded}
                    </span>
                )}
            </div>
            {passed ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
                <XCircle className="w-4 h-4 text-red-500" />
            )}
        </div>
    );
}

export default function SubmissionResultOverlay({
    checkpoints,
    score,
    courseId,
    onClose,
    testResults,
    rewards,
}) {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const hasTestResults = Array.isArray(testResults) && testResults.length > 0;
    const challenges = (checkpoints || []).filter((cp) => cp.type === 'challenge');
    const verifiedCount = hasTestResults
        ? testResults.filter((r) => r.passed).length
        : challenges.filter((cp) => cp.status === 'verified').length;
    const totalItems = hasTestResults ? testResults.length : challenges.length;

    const pointsEarned = rewards?.points_earned || 0;
    const badgesAwarded = rewards?.badges_awarded || [];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#161b22] border border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header/Banner */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center relative overflow-hidden shrink-0">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0 0 L100 0 L100 100 Z" fill="white" />
                        </svg>
                    </div>
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30 backdrop-blur-sm">
                        <Trophy className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight italic">{t('activityComplete')}</h2>
                    <p className="text-blue-100 font-medium">{t('progressRecorded')}</p>
                </div>

                <div className="p-8 overflow-auto">
                    {/* Score */}
                    <div className="flex items-center justify-center mb-8">
                        <div className="text-center">
                            <span className="block text-6xl font-black text-white leading-none">{score}{"%"}</span>
                            <span className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-2 block">{t('finalGrade')}</span>
                        </div>
                    </div>

                    {/* Rewards summary */}
                    {(pointsEarned > 0 || badgesAwarded.length > 0) && (
                        <div className="mb-6 grid grid-cols-2 gap-3">
                            {pointsEarned > 0 && (
                                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3">
                                    <Sparkles className="w-6 h-6 text-blue-300 shrink-0" />
                                    <div>
                                        <div className="text-xl font-bold text-white">+{pointsEarned}</div>
                                        <div className="text-[10px] text-blue-200 uppercase tracking-wider">points earned</div>
                                    </div>
                                </div>
                            )}
                            {badgesAwarded.length > 0 && (
                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                                    <Award className="w-6 h-6 text-amber-300 shrink-0" />
                                    <div>
                                        <div className="text-xl font-bold text-white">{badgesAwarded.length}</div>
                                        <div className="text-[10px] text-amber-200 uppercase tracking-wider">
                                            new badge{badgesAwarded.length === 1 ? '' : 's'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {badgesAwarded.length > 0 && (
                        <div className="mb-6 flex flex-wrap gap-2">
                            {badgesAwarded.map((b) => (
                                <span
                                    key={`${b.code}-${b.activity_id || ''}`}
                                    title={b.description || b.name}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200"
                                >
                                    {b.icon_url
                                        ? <img src={b.icon_url} alt="" className="w-3.5 h-3.5 object-contain" />
                                        : <Award className="w-3.5 h-3.5" />}
                                    {b.name || b.code}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Items list */}
                    <div className="space-y-3 mb-8 max-h-48 overflow-auto px-1">
                        {hasTestResults
                            ? testResults.map((r) => (
                                <TestResultRow key={r.test_case_id} result={r} />
                            ))
                            : challenges.map((cp) => (
                                <div key={cp.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${cp.status === 'verified' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <span className="text-sm font-medium text-gray-200">{cp.title}</span>
                                    </div>
                                    {cp.status === 'verified' ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                </div>
                            ))}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-gray-800/80 rounded-xl text-center">
                            <div className="text-2xl font-bold text-green-400">{verifiedCount}</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{t('verified')}</div>
                        </div>
                        <div className="p-4 bg-gray-800/80 rounded-xl text-center">
                            <div className="text-2xl font-bold text-gray-400">{totalItems}</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                {hasTestResults ? 'tests' : t('totalTasks')}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate(`/courses`)}
                            className="flex-1 py-4 px-6 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <Home className="w-5 h-5" />
                            {t('myCourses')}
                        </button>
                        <button
                            onClick={() => navigate(`/courses/${courseId}`)}
                            className="flex-1 py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            {t('continueBtn')}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
