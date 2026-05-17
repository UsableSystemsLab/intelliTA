import { Award, Lock } from 'lucide-react';
import useRewards from '@/utils/useRewards';

const TIER_COLORS = {
    BRONZE: 'from-amber-700/40 to-amber-900/30 border-amber-700/50 text-amber-300',
    SILVER: 'from-slate-400/30 to-slate-600/20 border-slate-400/50 text-slate-200',
    GOLD: 'from-yellow-400/30 to-yellow-600/20 border-yellow-400/50 text-yellow-200',
};

function BadgeTile({ badge, locked }) {
    const tierStyle = TIER_COLORS[badge.tier] || 'from-blue-500/20 to-indigo-500/10 border-blue-500/40 text-blue-200';
    return (
        <div
            title={badge.description || badge.name}
            className={`group relative rounded-xl border bg-gradient-to-br p-3 flex flex-col items-center text-center
                transition-all ${locked ? 'opacity-40 grayscale border-gray-700 from-gray-800 to-gray-900' : tierStyle}`}
        >
            <div className="w-12 h-12 rounded-lg bg-black/30 flex items-center justify-center mb-2">
                {locked ? (
                    <Lock className="w-5 h-5 text-gray-500" />
                ) : badge.icon_url ? (
                    <img src={badge.icon_url} alt="" className="w-9 h-9 object-contain" />
                ) : (
                    <Award className="w-6 h-6" />
                )}
            </div>
            <div className="text-xs font-semibold text-white truncate w-full">
                {badge.name || badge.code}
            </div>
            {!locked && badge.awarded_at && (
                <div className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(badge.awarded_at).toLocaleDateString()}
                </div>
            )}
            {badge.tier && !locked && (
                <span className="absolute top-1.5 right-1.5 text-[9px] font-bold uppercase tracking-wider opacity-80">
                    {badge.tier}
                </span>
            )}
        </div>
    );
}

export default function ProfileBadges({ user }) {
    const { badges, summary } = useRewards(user);
    const earned = badges?.earned || [];
    const locked = badges?.locked || [];
    const total = earned.length + locked.length;

    return (
        <div className="space-y-4">
            <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-semibold text-white">Badges</h3>
                <span className="text-xs text-gray-400">
                    {earned.length} / {total} earned
                </span>
            </div>
            {summary?.total_points != null && (
                <div className="text-sm text-gray-300">
                    <span className="text-2xl font-bold text-white align-middle">
                        {summary.total_points.toLocaleString()}
                    </span>
                    <span className="ml-2 text-xs uppercase tracking-wider text-gray-500">
                        total points
                    </span>
                </div>
            )}
            {total === 0 ? (
                <p className="text-sm text-gray-500 italic">No badges yet.</p>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {earned.map((b) => (
                        <BadgeTile key={`e-${b.code}-${b.activity_id || ''}-${b.awarded_at || ''}`} badge={b} />
                    ))}
                    {locked.map((b) => (
                        <BadgeTile key={`l-${b.code}`} badge={b} locked />
                    ))}
                </div>
            )}
        </div>
    );
}
