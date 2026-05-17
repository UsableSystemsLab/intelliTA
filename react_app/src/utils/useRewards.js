import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE, getAuthHeaders } from '../config/api';
import { auth } from './firebase.js';

const HISTORY_LIMIT = 20;

async function authFetch(url, init = {}) {
    const headers = await getAuthHeaders(auth.currentUser);
    return fetch(url, { ...init, headers: { ...(init.headers || {}), ...headers } });
}

async function getJson(url) {
    const res = await authFetch(url);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.json();
}

export default function useRewards(user) {
    const userId = user?.uid;

    const [summary, setSummary] = useState(null);
    const [badges, setBadges] = useState({ earned: [], locked: [] });
    const [history, setHistory] = useState([]);
    const [historyCursor, setHistoryCursor] = useState(null);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const inFlightHistoryRef = useRef(false);

    const loadSummary = useCallback(async () => {
        if (!userId) return;
        try {
            const data = await getJson(`${API_BASE}/users/${userId}/rewards`);
            setSummary(data);
        } catch (err) {
            setError(err.message);
        }
    }, [userId]);

    const loadBadges = useCallback(async () => {
        if (!userId) return;
        try {
            const data = await getJson(`${API_BASE}/users/${userId}/badges`);
            setBadges({
                earned: data.earned || [],
                locked: data.locked || [],
            });
        } catch (err) {
            setError(err.message);
        }
    }, [userId]);

    const loadHistory = useCallback(async ({ reset = false } = {}) => {
        if (!userId || inFlightHistoryRef.current) return;
        inFlightHistoryRef.current = true;
        try {
            const params = new URLSearchParams({ limit: String(HISTORY_LIMIT) });
            if (!reset && historyCursor) params.set('cursor', historyCursor);
            const data = await getJson(
                `${API_BASE}/users/${userId}/rewards/history?${params.toString()}`
            );
            const page = data.lines || data.items || [];
            const nextCursor = data.next_cursor || null;
            setHistory((prev) => (reset ? page : [...prev, ...page]));
            setHistoryCursor(nextCursor);
            setHasMoreHistory(Boolean(nextCursor) && page.length > 0);
        } catch (err) {
            setError(err.message);
        } finally {
            inFlightHistoryRef.current = false;
        }
    }, [userId, historyCursor]);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        setHistoryCursor(null);
        setHasMoreHistory(true);
        await Promise.all([
            loadSummary(),
            loadBadges(),
            loadHistory({ reset: true }),
        ]);
        setLoading(false);
    }, [loadSummary, loadBadges, loadHistory]);

    useEffect(() => {
        if (!userId) return undefined;
        refresh();
        const onRefresh = () => refresh();
        window.addEventListener('gamification:refresh', onRefresh);
        return () => window.removeEventListener('gamification:refresh', onRefresh);
    }, [userId]);

    return {
        summary,
        badges,
        history,
        hasMoreHistory,
        loading,
        error,
        loadMoreHistory: () => loadHistory({ reset: false }),
        refresh,
    };
}
