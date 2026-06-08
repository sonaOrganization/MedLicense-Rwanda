"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell, X, CheckCheck, Info, CheckCircle,
  AlertTriangle, AlertCircle, Inbox, Trash2,
} from "lucide-react";
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

const TYPE_CONFIG = {
  info:    { icon: Info,          iconCls: "text-blue-500",    ringCls: "ring-blue-500/20",    dotCls: "bg-blue-500",    bgCls: "bg-blue-50 dark:bg-blue-500/10"    },
  success: { icon: CheckCircle,   iconCls: "text-emerald-500", ringCls: "ring-emerald-500/20", dotCls: "bg-emerald-500", bgCls: "bg-emerald-50 dark:bg-emerald-500/10" },
  warning: { icon: AlertTriangle, iconCls: "text-amber-500",   ringCls: "ring-amber-500/20",   dotCls: "bg-amber-500",   bgCls: "bg-amber-50 dark:bg-amber-500/10"  },
  error:   { icon: AlertCircle,   iconCls: "text-red-500",     ringCls: "ring-red-500/20",     dotCls: "bg-red-500",     bgCls: "bg-red-50 dark:bg-red-500/10"      },
} as const;

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
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function markOneRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
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

  const unread  = notifications.filter((n) => !n.is_read);
  const read    = notifications.filter((n) => n.is_read);

  return (
    <div ref={panelRef} className="relative">

      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative p-2 rounded-xl transition-all duration-150",
          open
            ? "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
            : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
        aria-label={T("notif_title")}
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full ring-2 ring-white dark:ring-gray-950 leading-none animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[360px] max-w-[calc(100vw-24px)] bg-white dark:bg-gray-950 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-gray-800 z-50 flex flex-col overflow-hidden"
          style={{ animation: "notif-in 0.18s cubic-bezier(0.22,1,0.36,1)" }}
        >
          <style>{`
            @keyframes notif-in {
              from { opacity: 0; transform: translateY(-8px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0)   scale(1);    }
            }
          `}</style>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{T("notif_title")}</p>
                {unreadCount > 0 && (
                  <p className="text-[10px] text-indigo-500 dark:text-indigo-400 leading-none mt-0.5 font-medium">
                    {unreadCount} unread
                  </p>
                )}
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {T("notif_mark_all")}
              </button>
            )}
          </div>

          {/* Body */}
          <div className="overflow-y-auto max-h-[420px] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-400">Loading notifications…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center">
                  <Inbox className="w-7 h-7 text-gray-400 dark:text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{T("notif_empty")}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">You&apos;re all caught up!</p>
                </div>
              </div>
            ) : (
              <>
                {/* Unread section */}
                {unread.length > 0 && (
                  <div>
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                        New
                      </p>
                    </div>
                    {unread.map((n) => (
                      <NotifItem
                        key={n.id}
                        n={n}
                        onRead={markOneRead}
                        onDelete={deleteOne}
                        lang={language}
                        T={T as Parameters<typeof timeAgo>[2]}
                      />
                    ))}
                  </div>
                )}

                {/* Read section */}
                {read.length > 0 && (
                  <div>
                    {unread.length > 0 && (
                      <div className="px-4 pt-3 pb-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">
                          Earlier
                        </p>
                      </div>
                    )}
                    {read.map((n) => (
                      <NotifItem
                        key={n.id}
                        n={n}
                        onRead={markOneRead}
                        onDelete={deleteOne}
                        lang={language}
                        T={T as Parameters<typeof timeAgo>[2]}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800/80 bg-gray-50/60 dark:bg-gray-900/60 text-center">
              <p className="text-[10px] text-gray-400 dark:text-gray-600">
                {notifications.length} notification{notifications.length !== 1 ? "s" : ""} total
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotifItem({
  n, onRead, onDelete, lang, T,
}: {
  n: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  lang: Language;
  T: Parameters<typeof timeAgo>[2];
}) {
  const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info;
  const Icon = cfg.icon;

  return (
    <div
      onClick={() => !n.is_read && onRead(n.id)}
      className={cn(
        "group flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800/40 last:border-0 transition-all duration-100",
        !n.is_read
          ? "bg-indigo-50/60 dark:bg-indigo-500/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 cursor-pointer"
          : "hover:bg-gray-50/80 dark:hover:bg-gray-800/30 cursor-default"
      )}
    >
      {/* Icon bubble */}
      <div className={cn(
        "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ring-1",
        cfg.bgCls, cfg.ringCls
      )}>
        <Icon className={cn("w-4 h-4", cfg.iconCls)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "text-[13px] leading-snug font-semibold",
            !n.is_read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"
          )}>
            {n.title}
          </p>
          <button
            onClick={(e) => onDelete(n.id, e)}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-md text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
            title="Dismiss"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed line-clamp-2">
          {n.message}
        </p>

        <div className="flex items-center gap-2 mt-1.5">
          <p className="text-[10px] text-gray-400 dark:text-gray-600">
            {timeAgo(n.created_at, lang, T)}
          </p>
          {!n.is_read && (
            <>
              <span className="text-gray-200 dark:text-gray-700">·</span>
              <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400">
                Tap to mark read
              </span>
            </>
          )}
        </div>
      </div>

      {/* Unread dot */}
      {!n.is_read && (
        <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-2", cfg.dotCls)} />
      )}
    </div>
  );
}
