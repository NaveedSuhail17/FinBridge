'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@finbridge/sdk';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface ToastMsg {
  id: number;
  message: string;
}

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const toastId = useRef(0);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Show toast when new notification arrives
  useEffect(() => {
    function onNew() {
      const newest = notifications[0];
      if (!newest) return;
      const id = ++toastId.current;
      setToasts((prev) => [...prev, { id, message: newest.message }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    }
    window.addEventListener('finbridge:new-notification', onNew);
    return () => window.removeEventListener('finbridge:new-notification', onNew);
  }, [notifications]);

  return (
    <>
      {/* Inline toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-lg border bg-popover px-4 py-3 shadow-lg text-sm max-w-xs animate-in slide-in-from-bottom-2"
          >
            <p className="font-semibold text-xs text-muted-foreground mb-0.5">FinBridge</p>
            <p>{t.message}</p>
          </div>
        ))}
      </div>

      {/* Bell + dropdown */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative rounded-md p-2 text-muted-foreground hover:bg-accent"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-popover shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => void markAllRead()}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No notifications yet
                </p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => void markRead(n.id)}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-accent transition-colors border-b last:border-0 ${
                      n.read ? 'opacity-60' : 'font-medium'
                    }`}
                  >
                    <p className="leading-snug">{n.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
