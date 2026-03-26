'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CalendarCheck, CheckCheck, X, Car, XCircle } from 'lucide-react';
import { api, Notification } from '@/lib/api';

const POLL_INTERVAL = 20_000; // 20 seconds

const TYPE_CONFIG: Record<Notification['type'], { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  new_booking:        { icon: CalendarCheck, color: 'bg-blue-100 text-blue-600' },
  booking_confirmed:  { icon: Car,           color: 'bg-green-100 text-green-600' },
  booking_cancelled:  { icon: XCircle,       color: 'bg-red-100 text-red-500' },
  booking_completed:  { icon: CheckCheck,    color: 'bg-purple-100 text-purple-600' },
};

interface Toast {
  id: string;
  notification: Notification;
}

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const firstLoadRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const data = await api.getNotifications();
      const incoming = data.notifications;
      const newOnes = incoming.filter((n) => !prevIdsRef.current.has(n._id) && !n.read);

      // On first load just seed the set, don't toast
      if (!firstLoadRef.current && newOnes.length > 0) {
        setToasts((prev) => [
          ...prev,
          ...newOnes.map((n) => ({ id: n._id, notification: n })),
        ]);
      }

      prevIdsRef.current = new Set(incoming.map((n) => n._id));
      firstLoadRef.current = false;
      setNotifications(incoming);
      setUnreadCount(data.unreadCount);
    } catch {
      // not logged in or network error — silent
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Auto-dismiss toasts after 5s
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [toasts]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleOpen() {
    setOpen((o) => !o);
  }

  async function markAllRead() {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function handleNotificationClick(n: Notification) {
    if (!n.read) {
      await api.markNotificationRead(n._id);
      setNotifications((prev) => prev.map((x) => x._id === n._id ? { ...x, read: true } : x));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.bookingId) {
      // Owners go to bookings, renters go to my-trips
      if (n.type === 'new_booking') router.push('/host/bookings');
      else router.push('/my-trips');
    }
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <>
      {/* Bell button */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={handleOpen}
          className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold px-0.5">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">No notifications yet.</div>
              ) : notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type];
                const Icon = cfg.icon;
                return (
                  <button
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                        {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-4 py-2.5 border-t border-gray-100">
              <button
                onClick={() => { setOpen(false); router.push('/host/bookings'); }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View all bookings →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast stack */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 items-end pointer-events-none">
        {toasts.map((toast) => {
          const cfg = TYPE_CONFIG[toast.notification.type];
          const Icon = cfg.icon;
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-start gap-3 bg-white border border-gray-200 rounded-2xl shadow-xl px-4 py-3.5 w-80 animate-slide-up"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{toast.notification.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{toast.notification.message}</p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
