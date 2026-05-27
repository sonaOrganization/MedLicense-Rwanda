"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, X, CheckCheck, Info, CheckCircle, AlertTriangle, AlertCircle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language";
import { useT } from "@/lib/translations";
import type { Language } from "@/lib/language";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  is_read: boolean;
  created_at: string;
}

const TYPE_STYLES = {
  info:    { icon: Info,          ring: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-900/20"    },
  success: { icon: CheckCircle,   ring: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  warning: { icon: AlertTriangle, ring: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-900/20"  },
  error:   { icon: AlertCircle,   ring: "text-red-500",     bg: "bg-red-50 dark:bg-red-900/20"      },
};

function timeAgo(dateStr: string, lang: Language, T: (k: "notif_just_now" | "notif_m_ago" | "notif_h_ago" | "notif_d_ago") => string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return T("notif_just_now");
  if (m < 60) return lang === "FR" ? `il y a ${m} ${T("notif_m_ago")}` : `${m} ${T("notif_m_ago")}`;
  const h = Math.floor(m / 60);
  if (h < 24) return lang === "FR" ? `il y a ${h} ${T("notif_h_ago")}` : `${h} ${T("notif_h_ago")}`;
  return lang === "FR" ? `il y a ${Math.floor(h / 24)} ${T("notif_d_ago")}` : `${Math.floor(h / 24)} ${T("notif_d_ago")}`;
}

export function NotificationsDropdown() {
  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,       setLoading]       = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const T = useT(language);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function markOneRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  }

  async function deleteOne(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await fetch("/api/notifications", { method: "PATCH" });
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        aria-label={T("notif_title")}
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full ring-2 ring-white dark:ring-gray-950 leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 z-50 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{T("notif_title")}</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                  {unreadCount} {T("notif_new")}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" /> {T("notif_mark_all")}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[360px]">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                <Inbox className="w-8 h-8 opacity-40" />
                <p className="text-sm">{T("notif_empty")}</p>
              </div>
            ) : (
              notifications.map((n) => {
                const { icon: Icon, ring, bg } = TYPE_STYLES[n.type] ?? TYPE_STYLES.info;
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markOneRead(n.id)}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800/60 last:border-0 transition-colors",
                      !n.is_read
                        ? "bg-indigo-50/40 dark:bg-indigo-900/10 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", bg)}>
                      <Icon className={cn("w-4 h-4", ring)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={cn("text-xs font-semibold leading-snug truncate", !n.is_read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300")}>
                          {n.title}
                        </p>
                        <button
                          onClick={(e) => deleteOne(n.id, e)}
                          className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors ml-1 mt-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                        {timeAgo(n.created_at, language, T as Parameters<typeof timeAgo>[2])}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
