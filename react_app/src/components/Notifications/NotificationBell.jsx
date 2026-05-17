import { useState } from 'react';
import { Bell } from 'lucide-react';
import useNotifications from '@/utils/useNotifications';
import NotificationCenter from './NotificationCenter';

export default function NotificationBell({ user }) {
    const [open, setOpen] = useState(false);
    const {
        items,
        unreadCount,
        loading,
        hasMore,
        loadMore,
        refresh,
        markRead,
        markAllRead,
    } = useNotifications(user);

    if (!user) return null;

    const onToggle = () => {
        const next = !open;
        setOpen(next);
        if (next) refresh();
    };

    const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={onToggle}
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                className="relative inline-flex items-center justify-center w-9 h-9 rounded-full
                    text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors cursor-pointer"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span
                        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full
                            bg-red-500 text-white text-[10px] font-bold flex items-center justify-center
                            ring-2 ring-gray-900"
                    >
                        {badgeLabel}
                    </span>
                )}
            </button>
            <NotificationCenter
                isOpen={open}
                onClose={() => setOpen(false)}
                items={items}
                hasMore={hasMore}
                loading={loading}
                loadMore={loadMore}
                markRead={markRead}
                markAllRead={markAllRead}
                unreadCount={unreadCount}
            />
        </div>
    );
}
