import { Award, Trophy, Target, Loader2 } from 'lucide-react';
import useRewards from '@/utils/useRewards';
import ProfileBadges from '@/components/Profile/ProfileBadges';

function StatCard({ icon: Icon, label, value, accent }) {
    return (
        <div className="bg-gray-800/50 border border-gray-700/60 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 mb-2">
                <Icon className={`w-4 h-4 ${accent}`} />
                {label}
            </div>
            <div className="text-2xl font-bold text-white">
                {value ?? '—'}
            </div>
        </div>
    );
}

function eventLabel(eventType) {
    return String(eventType || '')
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function HistoryRow({ line }) {
    const points = line.points ?? 0;
    const sign = points >= 0 ? '+' : '';
    const color = points >= 0 ? 'text-emerald-300' : 'text-red-300';
    const created = line.created_at ? new Date(line.created_at) : null;
    return (
        <div className="flex items-center justify-between py-3 px-2 border-b border-gray-800/60 last:border-0">
            <div className="min-w-0">
                <div className="text-sm font-medium text-gray-200">
                    {eventLabel(line.event_type)}
                </div>
                <div className="text-xs text-gray-500">
                    {created ? created.toLocaleString() : ''}
                    {line.activity_id ? ` · activity #${line.activity_id}` : ''}
                </div>
            </div>
            <div className={`font-mono font-semibold ${color}`}>
                {sign}{points}
            </div>
        </div>
    );
}

export default function RewardsSection({ user }) {
    const {
        summary,
        history,
        hasMoreHistory,
        loading,
        loadMoreHistory,
    } = useRewards(user);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-semibold text-white mb-1">Your Rewards</h2>
                <p className="text-sm text-gray-400">Points, badges, and recent activity.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard
                    icon={Trophy}
                    label="Total points"
                    value={summary?.total_points?.toLocaleString()}
                    accent="text-yellow-300"
                />
                <StatCard
                    icon={Target}
                    label="Activities completed"
                    value={summary?.completed_activities}
                    accent="text-blue-300"
                />
                <StatCard
                    icon={Award}
                    label="Badges"
                    value={
                        summary
                            ? `${summary.badges_earned_count ?? 0} / ${summary.badges_total_count ?? 0}`
                            : null
                    }
                    accent="text-amber-300"
                />
            </div>

            <ProfileBadges user={user} />

            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Points history</h3>
                <div className="bg-gray-800/30 border border-gray-700/60 rounded-xl">
                    {history.length === 0 && !loading && (
                        <div className="px-4 py-10 text-center text-sm text-gray-500">
                            No points earned yet.
                        </div>
                    )}
                    {history.map((line) => (
                        <HistoryRow key={line.ledger_id || `${line.created_at}-${line.event_type}`} line={line} />
                    ))}
                    {loading && (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                        </div>
                    )}
                    {hasMoreHistory && !loading && history.length > 0 && (
                        <div className="px-4 py-3 text-center">
                            <button
                                type="button"
                                onClick={loadMoreHistory}
                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Load more
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
