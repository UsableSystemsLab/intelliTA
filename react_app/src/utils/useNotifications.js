import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE, getAuthHeaders } from '../config/api';
import { auth } from './firebase.js';

const PAGE_LIMIT = 20;
const UNREAD_POLL_MS = 60_000;

async function authFetch(url, init = {}) {
    const headers = await getAuthHeaders(auth.currentUser);
    return fetch(url, { ...init, headers: { ...(init.headers || {}), ...headers } });
}

export default function useNotifications(user) {
    const [items, setItems] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const inFlightRef = useRef(false);

    const userId = user?.uid;

    const fetchUnread = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await authFetch(`${API_BASE}/users/${userId}/notifications/unread-count`);
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.count ?? data.unread_count ?? 0);
            }
        } catch {
            
        }
    }, [userId]);

    const loadPage = useCallback(async ({ reset = false } = {}) => {
        if (!userId || inFlightRef.current) return;
        inFlightRef.current = true;
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ limit: String(PAGE_LIMIT) });
            if (!reset && cursor) params.set('cursor', cursor);
            const res = await authFetch(
                `${API_BASE}/users/${userId}/notifications?${params.toString()}`
            );
            if (!res.ok) throw new Error(`Failed (${res.status})`);
            const data = await res.json();
            const page = data.notifications || data.items || [];
            const nextCursor = data.next_cursor || null;
            setItems((prev) => (reset ? page : [...prev, ...page]));
            setCursor(nextCursor);
            setHasMore(Boolean(nextCursor) && page.length > 0);
        } catch (err) {
            setError(err.message || 'Failed to load notifications');
        } finally {
            inFlightRef.current = false;
            setLoading(false);
        }
    }, [userId, cursor]);

    const refresh = useCallback(async () => {
        setCursor(null);
        setHasMore(true);
        await Promise.all([loadPage({ reset: true }), fetchUnread()]);
    }, [loadPage, fetchUnread]);

    const markRead = useCallback(async (id) => {
        if (!id) return;
        setItems((prev) => prev.map((n) =>
            n.notification_id === id || n.id === id
                ? { ...n, is_read: true, read_at: new Date().toISOString() }
                : n
        ));
        setUnreadCount((c) => Math.max(0, c - 1));
        try {
            await authFetch(`${API_BASE}/notifications/${id}/read`, { method: 'PATCH' });
        } catch {
            fetchUnread();
        }
    }, [fetchUnread]);

    const markAllRead = useCallback(async () => {
        if (!userId) return;
        setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
        try {
            await authFetch(`${API_BASE}/notifications/read-all`, { method: 'POST' });
        } catch {
            fetchUnread();
        }
    }, [userId, fetchUnread]);

    // Poll unread count + refetch on window focus / external refresh signal.
    useEffect(() => {
        if (!userId) return undefined;
        fetchUnread();
        const id = setInterval(fetchUnread, UNREAD_POLL_MS);
        const onFocus = () => fetchUnread();
        const onRefresh = () => fetchUnread();
        window.addEventListener('focus', onFocus);
        window.addEventListener('gamification:refresh', onRefresh);
        return () => {
            clearInterval(id);
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('gamification:refresh', onRefresh);
        };
    }, [userId, fetchUnread]);

    return {
        items,
        unreadCount,
        loading,
        error,
        hasMore,
        loadMore: () => loadPage({ reset: false }),
        refresh,
        markRead,
        markAllRead,
    };
}
