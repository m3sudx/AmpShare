import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Bell, BellOff } from "lucide-react";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsQuery,
  useRealtimeNotifications,
} from "../../hooks/useNotifications";
import type { AppNotification } from "../../types/notification";
import { useRealtimeBookings } from "../../hooks/useBookingLive";

function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

// Where a notification should take the user
function notificationTarget(n: AppNotification): string | null {
  // A new booking request goes to the host's list, where they can confirm it
  if (/CREATED|REQUEST/i.test(n.type)) return "/bookings?as=host";
  return n.bookingId ? `/bookings/${n.bookingId}` : null;
}

export default function NotificationBell() {
  useRealtimeNotifications();
    useRealtimeBookings();

  const navigate = useNavigate();
  const { data } = useNotificationsQuery();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = data?.unreadCount ?? 0;
  const items = data?.notifications ?? [];

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function openItem(n: AppNotification) {
    if (!n.readAt) markRead.mutate(n.id);
    setOpen(false);
    const target = notificationTarget(n);
    if (target) navigate(target);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <Bell size={22} strokeWidth={1.9} />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0B7A55] px-1 text-[11px] font-bold leading-none text-white ring-2 ring-white dark:ring-[#111d18]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-18 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-base font-bold text-slate-900">Notifications</h2>
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={unread === 0 || markAll.isPending}
              className="min-h-9 cursor-pointer rounded-lg px-2 text-sm font-semibold text-[#0B7A55] hover:bg-[#F0FAF6] disabled:cursor-default disabled:text-slate-400 disabled:hover:bg-transparent dark:hover:bg-[#12302a]"
            >
              Mark all as read
            </button>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <BellOff size={22} />
              </span>
              <p className="text-sm font-semibold text-slate-900">You're all caught up</p>
              <p className="text-sm text-slate-600">New booking updates will appear here.</p>
            </div>
          ) : (
            <ul className="max-h-[min(420px,60vh)] overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className="border-b border-slate-100 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className={`flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 ${
                      n.readAt ? "" : "bg-[#F0FAF6] dark:bg-[#12302a]"
                    }`}
                  >
                    <span
                      className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                        n.readAt ? "bg-transparent" : "bg-[#0F9468]"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">{n.title}</span>
                      <span className="block text-sm text-slate-600">{n.body}</span>
                      <span className="mt-1 block text-xs text-slate-500">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}