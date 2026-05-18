import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ActivityResetModal({ onAcknowledge, isAcknowledging }) {
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">{t('activityUpdated')}</h3>
                <p className="text-base text-gray-300 mb-8 leading-relaxed">{t('activityUpdatedMessage')}</p>
                <button
                    type="button"
                    onClick={onAcknowledge}
                    disabled={isAcknowledging}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 border-none cursor-pointer"
                >
                    {t('gotIt')}
                </button>
            </div>
        </div>
    );
}
