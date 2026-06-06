"use client";
import { useState, useMemo } from "react";
import {
  Search, X, Users, CreditCard, Clock, Ban, ChevronRight,
} from "lucide-react";
import { getLicenseCategoryLabel } from "@/lib/license-categories";
import { UserActions } from "./UserActions";
import { cn } from "@/lib/utils";

interface Subscription {
  status?: string | null;
  plan?: string | null;
  end_date?: string | null;
  trial_ends_at?: string | null;
  start_date?: string | null;
}

interface User {
  id: string;
  name?: string | null;
  email: string;
  role: string;
  phone?: string | null;
  license_category?: string | null;
  is_banned: boolean;
  created_at: string;
  last_login_at?: string | null;
  subscription?: Subscription | null;
  exam_count: number;
  avg_score?: number | null;
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN:      "bg-red-500/15 text-red-400 border border-red-500/25",
  INSTRUCTOR: "bg-blue-500/15 text-blue-400 border border-blue-500/25",
  STUDENT:    "bg-gray-500/15 text-gray-400 border border-gray-500/25",
};

const PLAN_BADGE: Record<string, string> = {
  ACTIVE:    "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
  TRIAL:     "bg-amber-500/15 text-amber-400 border border-amber-500/25",
  FREE:      "bg-gray-500/15 text-gray-400 border border-gray-500/25",
  EXPIRED:   "bg-red-500/15 text-red-400 border border-red-500/25",
  CANCELLED: "bg-gray-700/30 text-gray-500 border border-gray-700/30",
};

function getExpiry(sub?: Subscription | null) {
  const date = sub?.end_date ?? sub?.trial_ends_at ?? null;
  if (!date) return { date: null, daysLeft: null };
  const daysLeft = Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
  return { date, daysLeft };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function StatCard({ icon: Icon, label, value, accent }: {
  icon: React.ElementType; label: string; value: number; accent: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", accent)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

export function UsersClient({ users }: { users: User[] }) {
  const [search,      setSearch]      = useState("");
  const [role,        setRole]        = useState("");
  const [planStatus,  setPlanStatus]  = useState("");
  const [joinedFrom,  setJoinedFrom]  = useState("");
  const [joinedTo,    setJoinedTo]    = useState("");
  const [expiresFrom, setExpiresFrom] = useState("");
  const [expiresTo,   setExpiresTo]   = useState("");

  const stats = useMemo(() => ({
    total:  users.length,
    active: users.filter((u) => u.subscription?.status === "ACTIVE").length,
    trial:  users.filter((u) => u.subscription?.status === "TRIAL").length,
    banned: users.filter((u) => u.is_banned).length,
  }), [users]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (search) {
        const s = search.toLowerCase();
        if (!u.name?.toLowerCase().includes(s) && !u.email.toLowerCase().includes(s)) return false;
      }
      if (role && u.role !== role) return false;
      if (planStatus && (u.subscription?.status ?? "FREE") !== planStatus) return false;

      if (joinedFrom && new Date(u.created_at) < new Date(joinedFrom)) return false;
      if (joinedTo   && new Date(u.created_at) > new Date(joinedTo + "T23:59:59Z")) return false;

      if (expiresFrom || expiresTo) {
        const expDate = u.subscription?.end_date ?? u.subscription?.trial_ends_at;
        if (!expDate) return false;
        if (expiresFrom && new Date(expDate) < new Date(expiresFrom)) return false;
        if (expiresTo   && new Date(expDate) > new Date(expiresTo + "T23:59:59Z")) return false;
      }

      return true;
    });
  }, [users, search, role, planStatus, joinedFrom, joinedTo, expiresFrom, expiresTo]);

  const hasFilters = search || role || planStatus || joinedFrom || joinedTo || expiresFrom || expiresTo;

  function clearFilters() {
    setSearch(""); setRole(""); setPlanStatus("");
    setJoinedFrom(""); setJoinedTo(""); setExpiresFrom(""); setExpiresTo("");
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length !== users.length
              ? <>{filtered.length} <span className="text-gray-600">of</span> {users.length} users</>
              : <>{users.length} total users</>
            }
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users}      label="Total Users"          value={stats.total}  accent="bg-blue-500/20 text-blue-400" />
        <StatCard icon={CreditCard} label="Active Subscriptions" value={stats.active} accent="bg-emerald-500/20 text-emerald-400" />
        <StatCard icon={Clock}      label="On Trial"             value={stats.trial}  accent="bg-amber-500/20 text-amber-400" />
        <StatCard icon={Ban}        label="Banned Accounts"      value={stats.banned} accent="bg-red-500/20 text-red-400" />
      </div>

      {/* Filter panel */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">

        {/* Row 1: search + dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="INSTRUCTOR">Instructor</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select
            value={planStatus}
            onChange={(e) => setPlanStatus(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Plans</option>
            <option value="FREE">Free</option>
            <option value="TRIAL">Trial</option>
            <option value="ACTIVE">Active (Paid)</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>

        {/* Row 2: date filters */}
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-gray-800">
          {/* Registration date range */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 w-24 flex-shrink-0">
              Registered
            </span>
            <input
              type="date"
              value={joinedFrom}
              onChange={(e) => setJoinedFrom(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <ChevronRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
            <input
              type="date"
              value={joinedTo}
              onChange={(e) => setJoinedTo(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="h-4 w-px bg-gray-700 hidden md:block" />

          {/* Subscription expiry range */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 w-24 flex-shrink-0">
              Sub Expires
            </span>
            <input
              type="date"
              value={expiresFrom}
              onChange={(e) => setExpiresFrom(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <ChevronRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
            <input
              type="date"
              value={expiresTo}
              onChange={(e) => setExpiresTo(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {["User", "Role", "Plan", "Expires", "Progress", "Last Active", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      "px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500",
                      h === "" ? "text-right" : "text-left"
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <p className="text-gray-500 text-sm">No users match the current filters.</p>
                    {hasFilters && (
                      <button onClick={clearFilters} className="mt-2 text-xs text-blue-400 hover:text-blue-300">
                        Clear all filters
                      </button>
                    )}
                  </td>
                </tr>
              )}

              {filtered.map((user) => {
                const { date: expDate, daysLeft } = getExpiry(user.subscription);
                const subStatus = user.subscription?.status ?? "FREE";
                const planName  = user.subscription?.plan;
                const isExpired = daysLeft !== null && daysLeft < 0;
                const isCritical = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
                const isWarning  = daysLeft !== null && daysLeft > 7 && daysLeft <= 30;

                return (
                  <tr key={user.id} className="hover:bg-gray-800/20 transition-colors group">

                    {/* User */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {user.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white leading-tight truncate">{user.name ?? "—"}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          {user.license_category && (
                            <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 mt-1 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20">
                              {getLicenseCategoryLabel(user.license_category)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
                      <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded", ROLE_BADGE[user.role] ?? ROLE_BADGE.STUDENT)}>
                        {user.role}
                      </span>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3.5">
                      <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded", PLAN_BADGE[subStatus] ?? PLAN_BADGE.FREE)}>
                        {subStatus}
                      </span>
                      {planName && planName !== "free" && (
                        <p className="text-[10px] text-gray-600 mt-0.5 capitalize">{planName}</p>
                      )}
                    </td>

                    {/* Expires */}
                    <td className="px-4 py-3.5">
                      {expDate ? (
                        <div>
                          <p className={cn("text-xs font-medium", {
                            "text-red-400":   isExpired || isCritical,
                            "text-amber-400": isWarning,
                            "text-gray-300":  !isExpired && !isCritical && !isWarning,
                          })}>
                            {fmtDate(expDate)}
                          </p>
                          {isExpired ? (
                            <p className="text-[10px] text-red-500 mt-0.5">Expired</p>
                          ) : isCritical ? (
                            <p className="text-[10px] text-red-400 mt-0.5">{daysLeft}d left</p>
                          ) : isWarning ? (
                            <p className="text-[10px] text-amber-400 mt-0.5">{daysLeft}d left</p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>

                    {/* Progress */}
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="text-gray-300 font-medium text-sm">
                          {user.exam_count} exam{user.exam_count !== 1 ? "s" : ""}
                        </p>
                        {user.avg_score !== null && user.avg_score !== undefined ? (
                          <p className={cn("text-xs font-semibold mt-0.5", user.avg_score >= 70 ? "text-emerald-400" : user.avg_score >= 50 ? "text-amber-400" : "text-red-400")}>
                            avg {user.avg_score}%
                          </p>
                        ) : (
                          <p className="text-xs text-gray-600 mt-0.5">no attempts</p>
                        )}
                      </div>
                    </td>

                    {/* Last Active */}
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                      {user.last_login_at ? (
                        <div>
                          <p className="text-gray-400">{fmtDate(user.last_login_at)}</p>
                          <p className="text-gray-600 mt-0.5">
                            {Math.ceil((Date.now() - new Date(user.last_login_at).getTime()) / 86_400_000)}d ago
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-600">Never</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded border", user.is_banned
                        ? "bg-red-500/15 text-red-400 border-red-500/25"
                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                      )}>
                        {user.is_banned ? "Banned" : "Active"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <UserActions userId={user.id} isBanned={user.is_banned} role={user.role} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
            <p className="text-xs text-gray-600">
              Showing {filtered.length} user{filtered.length !== 1 ? "s" : ""}
            </p>
            {hasFilters && (
              <p className="text-xs text-gray-600">
                {users.length - filtered.length} hidden by filters
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
