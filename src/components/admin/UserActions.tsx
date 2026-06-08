"use client";
import { useState } from "react";
import { MoreHorizontal, Ban, UserCheck, Shield, UserMinus, CreditCard, XCircle, X, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface UserActionsProps {
  userId: string;
  isBanned: boolean;
  role: string;
  hasActiveSubscription?: boolean;
}

const DURATIONS = [
  { label: "1 Month",  months: 1  },
  { label: "3 Months", months: 3  },
  { label: "6 Months", months: 6  },
  { label: "1 Year",   months: 12 },
  { label: "Custom",   months: 0  },
] as const;

function GrantModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const router = useRouter();
  const [duration, setDuration] = useState<number>(1);
  const [customDate, setCustomDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isCustom = duration === 0;

  // Minimum date for custom picker = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  async function handleGrant() {
    if (isCustom && !customDate) {
      toast.error("Please pick an end date");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { action: "grant_subscription", plan: "pro" };
      if (isCustom) body.end_date = customDate;
      else body.months = duration;

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Subscription granted successfully");
      onClose();
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to grant subscription");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-sm font-bold text-white">Grant Subscription</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">

          {/* Plan info */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-300">Pro Plan</p>
              <p className="text-[11px] text-emerald-500/80">Full access to all exams and features</p>
            </div>
          </div>

          {/* Duration picker */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Duration</p>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map(({ label, months }) => (
                <button
                  key={label}
                  onClick={() => setDuration(months)}
                  className={cn(
                    "px-2 py-2 text-xs font-semibold rounded-xl border transition-all",
                    duration === months
                      ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-900/40"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom date picker */}
          {isCustom && (
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">End Date</p>
              <input
                type="date"
                value={customDate}
                min={minDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-700 bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Preview */}
          {!isCustom && (
            <p className="text-xs text-gray-500">
              Access will expire on{" "}
              <span className="text-gray-300 font-medium">
                {(() => {
                  const d = new Date();
                  d.setMonth(d.getMonth() + duration);
                  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
                })()}
              </span>
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-800 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm rounded-xl border border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGrant}
            disabled={submitting || (isCustom && !customDate)}
            className="flex-1 px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Granting…" : "Grant Access"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UserActions({ userId, isBanned, role, hasActiveSubscription }: UserActionsProps) {
  const [open,        setOpen]        = useState(false);
  const [grantOpen,   setGrantOpen]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const router = useRouter();

  async function action(type: string) {
    setLoading(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: type }),
      });
      if (!res.ok) throw new Error("Action failed");
      toast.success("User updated");
      router.refresh();
    } catch {
      toast.error("Action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="relative inline-block">
        <button
          onClick={() => setOpen(!open)}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-gray-700/60 text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-40"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 mt-1 w-52 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden">

              {/* Grant / Revoke Subscription */}
              <button
                onClick={() => { setOpen(false); setGrantOpen(true); }}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 hover:bg-gray-700/50 text-emerald-400 transition-colors"
              >
                <CreditCard className="w-4 h-4 flex-shrink-0" />
                Grant Subscription
              </button>

              {hasActiveSubscription && (
                <button
                  onClick={() => action("revoke_subscription")}
                  className="w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 hover:bg-gray-700/50 text-amber-400 transition-colors"
                >
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  Revoke Subscription
                </button>
              )}

              <div className="h-px bg-gray-700/60 my-1" />

              {/* Ban / Unban */}
              <button
                onClick={() => action(isBanned ? "unban" : "ban")}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 hover:bg-gray-700/50 transition-colors ${
                  isBanned ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {isBanned
                  ? <><UserCheck className="w-4 h-4 flex-shrink-0" /> Unban User</>
                  : <><Ban className="w-4 h-4 flex-shrink-0" /> Ban User</>
                }
              </button>

              <div className="h-px bg-gray-700/60 my-1" />

              {/* Role change */}
              {role !== "ADMIN" && (
                <button
                  onClick={() => action("make_admin")}
                  className="w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 hover:bg-gray-700/50 text-gray-300 transition-colors"
                >
                  <Shield className="w-4 h-4 flex-shrink-0 text-blue-400" />
                  Make Admin
                </button>
              )}
              {role === "ADMIN" && (
                <button
                  onClick={() => action("make_student")}
                  className="w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 hover:bg-gray-700/50 text-gray-300 transition-colors"
                >
                  <UserMinus className="w-4 h-4 flex-shrink-0 text-amber-400" />
                  Demote to Student
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {grantOpen && <GrantModal userId={userId} onClose={() => setGrantOpen(false)} />}
    </>
  );
}
