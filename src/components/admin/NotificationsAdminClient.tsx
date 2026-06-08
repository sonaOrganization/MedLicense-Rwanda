"use client";
import { useState } from "react";
import { Bell, Send, Users, Info, CheckCircle, AlertTriangle, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

interface Props {
  studentCount: number;
  recentBroadcasts: Broadcast[];
}

const TYPES = [
  { key: "info",    label: "Info",    icon: Info,          color: "text-blue-400",    bg: "bg-blue-500/15 border-blue-500/30"    },
  { key: "success", label: "Success", icon: CheckCircle,   color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
  { key: "warning", label: "Warning", icon: AlertTriangle, color: "text-amber-400",   bg: "bg-amber-500/15 border-amber-500/30"  },
  { key: "error",   label: "Urgent",  icon: AlertCircle,   color: "text-red-400",     bg: "bg-red-500/15 border-red-500/30"      },
] as const;

type NotifType = "info" | "success" | "warning" | "error";

function fmtDate(iso: string) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 1)   return "Just now";
  if (diff < 60)  return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function NotificationsAdminClient({ studentCount, recentBroadcasts }: Props) {
  const [type,       setType]       = useState<NotifType>("info");
  const [title,      setTitle]      = useState("");
  const [message,    setMessage]    = useState("");
  const [sending,    setSending]    = useState(false);
  const [sentCount,  setSentCount]  = useState<number | null>(null);

  const titleOk   = title.trim().length >= 3;
  const messageOk = message.trim().length >= 5;
  const canSend   = titleOk && messageOk && !sending;

  const selectedType = TYPES.find((t) => t.key === type)!;
  const PreviewIcon  = selectedType.icon;

  async function handleSend() {
    if (!canSend) return;
    if (!confirm(`Send this notification to all ${studentCount} students? This cannot be undone.`)) return;

    setSending(true);
    setSentCount(null);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSentCount(data.sent);
      toast.success(`Notification sent to ${data.sent} students`);
      setTitle("");
      setMessage("");
      setType("info");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Broadcast Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">Send a notification to all students at once</p>
        </div>
      </div>

      {/* Reach badge */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gray-900 border border-gray-800">
        <Users className="w-4 h-4 text-indigo-400 flex-shrink-0" />
        <p className="text-sm text-gray-300">
          This notification will be delivered to{" "}
          <span className="font-bold text-white">{studentCount.toLocaleString()} active students</span>
          {" "}and appear in their notification bell instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Compose form */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="text-sm font-bold text-white">Compose Message</h2>
          </div>

          <div className="px-5 py-5 space-y-4">

            {/* Type selector */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notification Type</p>
              <div className="grid grid-cols-4 gap-2">
                {TYPES.map(({ key, label, icon: Icon, color, bg }) => (
                  <button
                    key={key}
                    onClick={() => setType(key as NotifType)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border text-xs font-semibold transition-all",
                      type === key
                        ? `${bg} ${color}`
                        : "bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</p>
                <span className={cn("text-[10px]", title.length > 70 ? "text-red-400" : "text-gray-600")}>
                  {title.length}/80
                </span>
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                placeholder="e.g. New exam available"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Message</p>
                <span className={cn("text-[10px]", message.length > 230 ? "text-red-400" : "text-gray-600")}>
                  {message.length}/250
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 250))}
                placeholder="Write your message here…"
                rows={4}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/40"
            >
              <Send className="w-4 h-4" />
              {sending ? "Sending…" : `Send to All ${studentCount.toLocaleString()} Students`}
            </button>

            {sentCount !== null && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                Successfully sent to {sentCount} students
              </div>
            )}
          </div>
        </div>

        {/* Preview + history */}
        <div className="space-y-4">

          {/* Live preview */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h2 className="text-sm font-bold text-white">Preview</h2>
              <p className="text-xs text-gray-600 mt-0.5">How it will appear in the notification bell</p>
            </div>
            <div className="px-5 py-4">
              <div className={cn("flex items-start gap-3 p-3 rounded-xl border", selectedType.bg)}>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", selectedType.bg)}>
                  <PreviewIcon className={cn("w-4 h-4", selectedType.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-bold leading-snug", selectedType.color)}>
                    {title.trim() || <span className="opacity-40">Notification title…</span>}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                    {message.trim() || <span className="opacity-40">Your message will appear here…</span>}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-1">Just now</p>
                </div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />
              </div>
            </div>
          </div>

          {/* Recent broadcasts */}
          {recentBroadcasts.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <h2 className="text-sm font-bold text-white">Recent Broadcasts</h2>
              </div>
              <div className="divide-y divide-gray-800/60">
                {recentBroadcasts.map((b) => {
                  const t = TYPES.find((x) => x.key === b.type) ?? TYPES[0];
                  const BIcon = t.icon;
                  return (
                    <div key={b.id} className="flex items-start gap-3 px-5 py-3">
                      <BIcon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", t.color)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-300 truncate">{b.title}</p>
                        <p className="text-[11px] text-gray-600 truncate mt-0.5">{b.message}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-600 whitespace-nowrap flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {fmtDate(b.created_at)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
