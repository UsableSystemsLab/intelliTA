import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Trophy, Home, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SubmissionResultOverlay({
    checkpoints,
    score,
    courseId,
    onClose
}) {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Count every gradable task (code challenges + quizzes), ignore instructor updates
    const GRADABLE_TYPES = ['challenge', 'mcq', 'true_false', 'fill_blank'];
    const challenges = checkpoints.filter(cp => GRADABLE_TYPES.includes(cp.type));
    const verifiedCount = challenges.filter(cp => cp.status === 'verified').length;
    const totalChallenges = challenges.length;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#161b22] border border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header/Banner */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center relative overflow-hidden">
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

                <div className="p-8">
                    {/* Score Wheel/Display */}
                    <div className="flex items-center justify-center mb-10">
                        <div className="text-center">
                            <span className="block text-6xl font-black text-white leading-none">{score}{"%"}</span>
                            <span className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-2 block">{t('finalGrade')}</span>
                        </div>
                    </div>

                    {/* Checkpoints List - Only Challenges */}
                    <div className="space-y-3 mb-10 max-h-48 overflow-auto px-2">
                        {challenges.map((cp) => (
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
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="p-4 bg-gray-800/80 rounded-xl text-center">
                            <div className="text-2xl font-bold text-green-400">{verifiedCount}</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{t('verified')}</div>
                        </div>
                        <div className="p-4 bg-gray-800/80 rounded-xl text-center">
                            <div className="text-2xl font-bold text-gray-400">{totalChallenges}</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{t('totalTasks')}</div>
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
