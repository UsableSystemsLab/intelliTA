import { X, AlertTriangle, UserMinus } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function KickConfirmModal({ member, onConfirm, onClose, loading }) {
    const { t } = useTranslation();
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="relative bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-md w-full mx-4 shadow-2xl">
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />

                <button
                    onClick={onClose}
                    disabled={loading}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="relative z-10">
                    {/* Icon */}
                    <div className="flex items-center justify-center mb-6">
                        <div className="p-4 bg-red-500/10 rounded-full">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white text-center mb-2">
                        {t('removeStudent')}
                    </h3>

                    {/* Message */}
                    <p className="text-gray-400 text-center mb-6">
                        {t('confirmRemoveStudentText', { name: `${member?.first_name} ${member?.last_name}` })}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50"
                        >
                            <UserMinus className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
                            {loading ? t('removing') : t('remove')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
