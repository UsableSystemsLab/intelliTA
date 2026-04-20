import { useTranslation } from 'react-i18next';

export default function ErrorScreen({ message, onBack, courseId }) {
    const { t } = useTranslation();
    return (
        <div className="h-screen bg-[#0d1117] flex items-center justify-center text-white">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">{t('activityNotFound')}</h1>
                <p className="text-gray-400 mb-4">{message || "Could not load activity data."}</p>
                <button onClick={onBack} className="text-blue-400 hover:underline">
                    {t('backToCourse')}
                </button>
            </div>
        </div>
    );
}
