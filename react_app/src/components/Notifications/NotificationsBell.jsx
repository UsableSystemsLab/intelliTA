import { useState, useEffect, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { auth } from "@/utils/firebase";
import {
  getUnreadCount,
  listNotifications,
  markNotificationRead,
  markAllRead,
} from "@/config/gamificationApi";
import NotificationsDropdown from "@/components/Notifications/NotificationsDropdown";

const POLL_MS = 45000;

export default function NotificationsBell({ user, isArabic }) {
  const { t } = useTranslation();
  const userId = user?.id;

  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const containerRef = useRef(null);

  // Poll the unread count while logged in.
  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    const tick = async () => {
      try {
        const data = await getUnreadCount(auth.currentUser, userId);
        if (active) setCount(data?.count ?? 0);
      } catch {
        /* transient — keep last known count */
      }
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [userId]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const loadList = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(false);
    try {
      const data = await listNotifications(auth.currentUser, userId, { limit: 10 });
      setItems(data?.items ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  };

  const handleItemRead = async (id) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setCount((c) => Math.max(0, c - 1));
    try {
      await markNotificationRead(auth.currentUser, id);
    } catch {
      // Revert on failure.
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)),
      );
      setCount((c) => c + 1);
    }
  };

  const handleMarkAll = async () => {
    const snapshot = items;
    const prevCount = count;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setCount(0);
    try {
      await markAllRead(auth.currentUser);
    } catch {
      setItems(snapshot);
      setCount(prevCount);
    }
  };

  if (!userId) return null;

  const hasUnread = items.some((n) => !n.is_read);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label={t("notifications.title", { defaultValue: "Notifications" })}
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-full
                   text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full
                       bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <NotificationsDropdown
          items={items}
          loading={loading}
          error={error}
          hasUnread={hasUnread}
          onItemRead={handleItemRead}
          onMarkAll={handleMarkAll}
          isArabic={isArabic}
        />
      )}
    </div>
  );
}
