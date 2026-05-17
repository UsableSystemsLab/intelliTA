import { useEffect, useRef } from 'react';
import { Award, Sparkles, Bell, CheckCheck, Loader2 } from 'lucide-react';

function relativeTime(iso) {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '';
    const diff = Math.max(0, Date.now() - t);
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d ago`;
    return new Date(iso).toLocaleDateString();
}

function NotificationIcon({ type }) {
    const isBadge = type === 'BADGE_EARNED' || type === 'INSTRUCTOR_AWARD';
    return isBadge
        ? <Award className="w-4 h-4 text-amber-300" />
        : <Sparkles className="w-4 h-4 text-blue-300" />;
}

function NotificationRow({ notification, onClick }) {
    const id = notification.notification_id || notification.id;
    const unread = !notification.is_read;
    return (
        <button
            type="button"
            onClick={() => onClick(id)}
            className={`w-full text-left px-4 py-3 flex gap-3 transition-colors
                ${unread ? 'bg-blue-500/5 hover:bg-blue-500/10' : 'hover:bg-gray-800/50'}`}
        >
            <div className="shrink-0 mt-0.5 w-7 h-7 rounded-md bg-gray-800 border border-gray-700 flex items-center justify-center">
                <NotificationIcon type={notification.type} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-medium ${unread ? 'text-white' : 'text-gray-300'}`}>
                        {notification.title || '(no title)'}
                    </span>
                    {unread && <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-blue-400" />}
                </div>
                {notification.body && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-3 whitespace-pre-wrap">
                        {notification.body}
                    </p>
                )}
                <p className="text-[11px] text-gray-500 mt-1">
                    {relativeTime(notification.created_at)}
                </p>
            </div>
        </button>
    );
}

export default function NotificationCenter({
    isOpen,
    onClose,
    items,
    hasMore,
    loading,
    loadMore,
    markRead,
    markAllRead,
    unreadCount,
}) {
    const ref = useRef(null);
    const scrollRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return undefined;
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [isOpen, onClose]);

    // Infinite scroll
    const onScroll = () => {
        const el = scrollRef.current;
        if (!el || loading || !hasMore) return;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
            loadMore();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            ref={ref}
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-1rem)] bg-gray-900/95 backdrop-blur-xl
                border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50"
        >
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-gray-300" />
                    <span className="text-sm font-semibold text-white">Notifications</span>
                    {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={markAllRead}
                    disabled={unreadCount === 0}
                    className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white
                        disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Mark all as read"
                >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                </button>
            </div>

            <div
                ref={scrollRef}
                onScroll={onScroll}
                className="max-h-96 overflow-y-auto divide-y divide-gray-800/60"
            >
                {items.length === 0 && !loading && (
                    <div className="px-4 py-10 text-center text-sm text-gray-500">
                        No notifications yet.
                    </div>
                )}
                {items.map((n) => (
                    <NotificationRow
                        key={n.notification_id || n.id}
                        notification={n}
                        onClick={markRead}
                    />
                ))}
                {loading && (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    </div>
                )}
                {!hasMore && items.length > 0 && (
                    <div className="px-4 py-3 text-center text-[11px] text-gray-600">
                        End of list
                    </div>
                )}
            </div>
        </div>
    );
}
