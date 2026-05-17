import { useEffect, useState } from 'react';
import { Award, Sparkles, X } from 'lucide-react';
import { subscribeRewardsToast } from './rewardsToastBus';

const TOAST_TTL_MS = 6000;

function PointsLineDescription({ lines }) {
    if (!Array.isArray(lines) || lines.length === 0) return null;
    return (
        <div className="mt-2 space-y-0.5">
            {lines.map((line, i) => {
                const sign = line.points >= 0 ? '+' : '';
                const color = line.points >= 0 ? 'text-emerald-300' : 'text-red-300';
                return (
                    <div key={i} className="flex items-center justify-between text-xs text-gray-300">
                        <span className="capitalize">
                            {String(line.event_type || '').replace(/_/g, ' ').toLowerCase()}
                        </span>
                        <span className={`font-mono font-semibold ${color}`}>
                            {sign}{line.points}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function ToastCard({ toast, onDismiss }) {
    const isBadge = toast.kind === 'badge';
    const accent = isBadge
        ? 'from-amber-500/30 to-yellow-500/10 border-amber-500/40'
        : 'from-blue-500/30 to-indigo-500/10 border-blue-500/40';
    const icon = isBadge
        ? <Award className="w-6 h-6 text-amber-300" />
        : <Sparkles className="w-6 h-6 text-blue-300" />;

    return (
        <div
            role="status"
            className={`pointer-events-auto w-80 rounded-xl border bg-gradient-to-br ${accent}
                backdrop-blur-md shadow-2xl shadow-black/40 p-4 flex gap-3 animate-in slide-in-from-right`}
        >
            <div className="shrink-0 w-10 h-10 rounded-lg bg-black/30 flex items-center justify-center">
                {isBadge && toast.badge?.icon_url
                    ? <img src={toast.badge.icon_url} alt="" className="w-7 h-7 object-contain" />
                    : icon}
            </div>
            <div className="flex-1 min-w-0">
                {isBadge ? (
                    <>
                        <div className="text-sm font-semibold text-white">
                            Badge unlocked: {toast.badge?.name || toast.badge?.code}
                        </div>
                        {toast.badge?.description && (
                            <div className="text-xs text-gray-300 mt-1 line-clamp-2">
                                {toast.badge.description}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="text-sm font-semibold text-white">
                            +{toast.points} points
                        </div>
                        <PointsLineDescription lines={toast.lines} />
                    </>
                )}
            </div>
            <button
                onClick={() => onDismiss(toast.id)}
                className="shrink-0 text-gray-400 hover:text-white p-1 rounded-md hover:bg-black/30 transition-colors"
                aria-label="Dismiss"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

export default function RewardsToastContainer() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const unsubscribe = subscribeRewardsToast((toast) => {
            setToasts((prev) => [...prev, toast]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
            }, TOAST_TTL_MS);
        });
        return unsubscribe;
    }, []);

    const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

    if (toasts.length === 0) return null;

    return (
        <div className="pointer-events-none fixed top-20 right-4 z-[200] flex flex-col gap-3">
            {toasts.map((t) => (
                <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
            ))}
        </div>
    );
}
