'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationsService, type NotificationItem } from '../services/notifications.service';
import { useAuthStore } from '../store/auth.store';

export interface UseNotificationsResult {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const BASE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
  'http://localhost:3001/api/v1';

const POLL_INTERVAL_MS = 30_000;

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((s) => s.token);
  const prevUnreadRef = useRef<number | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchAll = useCallback(async () => {
    try {
      const res = await notificationsService.list(1, 50);
      setNotifications(res.data ?? []);
    } catch {
      // silently ignore — polling will retry
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + 30-s polling fallback
  useEffect(() => {
    void fetchAll();
    const interval = setInterval(() => void fetchAll(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // SSE connection
  useEffect(() => {
    if (!token) return;

    let es: EventSource | null = null;
    try {
      es = new EventSource(`${BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`);

      es.onmessage = (event: MessageEvent) => {
        try {
          const notification = JSON.parse(event.data as string) as NotificationItem;
          setNotifications((prev) => [notification, ...prev]);
        } catch {
          // malformed event — ignore
        }
      };

      es.onerror = () => {
        es?.close();
      };
    } catch {
      // SSE not supported — fall back to polling only
    }

    return () => {
      es?.close();
    };
  }, [token]);

  // Toast trigger: emit a browser custom event when unreadCount increases so
  // NotificationBell can subscribe without prop-drilling.
  // prevUnreadRef starts as null; first fetchAll sets the baseline without toasting.
  useEffect(() => {
    if (prevUnreadRef.current !== null && unreadCount > prevUnreadRef.current) {
      window.dispatchEvent(new CustomEvent('finbridge:new-notification'));
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  const markRead = useCallback(async (id: string) => {
    await notificationsService.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsService.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return { notifications, unreadCount, loading, markRead, markAllRead };
}
