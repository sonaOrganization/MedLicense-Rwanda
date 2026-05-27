import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  FileQuestion, FileText, Users, CreditCard,
  BarChart2, Video, ArrowRight, CheckCircle,
  Clock, TrendingUp, AlertCircle,
} from "lucide-react";

export default async function AdminDashboard() {
  const [
    { count: totalUsers },
    { count: pendingQuestions },
    { count: totalQuestions },
    { count: publishedExams },
    { count: draftExams },
    { count: totalVideos },
    { count: publishedVideos },
    { count: activeSubscriptions },
    { data: completedPayments },
    { count: totalAttempts },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }).eq("is_banned", false),
    supabase.from("questions").select("*", { count: "exact", head: true }).eq("is_approved", false),
    supabase.from("questions").select("*", { count: "exact", head: true }).eq("is_approved", true),
    supabase.from("exams").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("exams").select("*", { count: "exact", head: true }).eq("is_published", false),
    supabase.from("videos").select("*", { count: "exact", head: true }),
    supabase.from("videos").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).in("status", ["ACTIVE", "TRIAL"]),
    supabase.from("payments").select("amount").eq("status", "completed"),
    supabase.from("exam_attempts").select("*", { count: "exact", head: true }).eq("status", "COMPLETED"),
  ]);

  const totalRevenue = completedPayments?.reduce((s: number, p: { amount: number }) => s + p.amount, 0) ?? 0;

  // ── Top-level health strip ────────────────────────────────────────────
  const health = [
    { label: "Active Users",         value: (totalUsers ?? 0).toLocaleString(),              icon: Users,      color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Active Subscriptions", value: (activeSubscriptions ?? 0).toLocaleString(),     icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Exams Completed",      value: (totalAttempts ?? 0).toLocaleString(),           icon: TrendingUp,  color: "text-purple-600",  bg: "bg-purple-50 dark:bg-purple-900/20" },
    { label: "Total Revenue",        value: `${totalRevenue.toLocaleString()} RWF`,          icon: CreditCard,  color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-900/20" },
  ];

  // ── Management section cards ──────────────────────────────────────────
  const sections = [
    {
      href: "/admin/questions",
      icon: FileQuestion,
      label: "Questions",
      description: "Create, review, and approve exam questions across all categories.",
      accent: "from-blue-600 to-indigo-600",
      iconBg: "bg-blue-600",
      stats: [
        { label: "Approved",        value: totalQuestions ?? 0,  good: true  },
        { label: "Pending review",  value: pendingQuestions ?? 0, good: (pendingQuestions ?? 0) === 0 },
      ],
      alert: (pendingQuestions ?? 0) > 0 ? `${pendingQuestions} question${(pendingQuestions ?? 0) > 1 ? "s" : ""} awaiting approval` : null,
    },
    {
      href: "/admin/exams",
      icon: FileText,
      label: "Exams",
      description: "Manage mock exams — publish, draft, and configure exam settings.",
      accent: "from-purple-600 to-violet-600",
      iconBg: "bg-purple-600",
      stats: [
        { label: "Published",  value: publishedExams ?? 0, good: true },
        { label: "Drafts",     value: draftExams ?? 0,     good: true },
      ],
      alert: null,
    },
    {
      href: "/admin/users",
      icon: Users,
      label: "Users",
      description: "View all registered students, manage roles, and handle account issues.",
      accent: "from-emerald-600 to-teal-600",
      iconBg: "bg-emerald-600",
      stats: [
        { label: "Active accounts", value: totalUsers ?? 0,          good: true },
        { label: "Subscribed",      value: activeSubscriptions ?? 0, good: true },
      ],
      alert: null,
    },
    {
      href: "/admin/payments",
      icon: CreditCard,
      label: "Payments",
      description: "Track all subscription transactions, revenue, and payment status.",
      accent: "from-amber-500 to-orange-500",
      iconBg: "bg-amber-500",
      stats: [
        { label: "Total revenue", value: `${totalRevenue.toLocaleString()} RWF`, good: true },
        { label: "Subscriptions", value: activeSubscriptions ?? 0,               good: true },
      ],
      alert: null,
    },
    {
      href: "/admin/analytics",
      icon: BarChart2,
      label: "Analytics",
      description: "Monitor platform performance, exam completion rates, and student progress.",
      accent: "from-rose-500 to-pink-600",
      iconBg: "bg-rose-500",
      stats: [
        { label: "Exams completed", value: totalAttempts ?? 0, good: true },
        { label: "Active users",    value: totalUsers ?? 0,    good: true },
      ],
      alert: null,
    },
    {
      href: "/admin/content",
      icon: Video,
      label: "Content Management",
      description: "Upload and publish tutorial videos for students preparing for the RMDC exam.",
      accent: "from-cyan-600 to-sky-600",
      iconBg: "bg-cyan-600",
      stats: [
        { label: "Published videos", value: publishedVideos ?? 0, good: true },
        { label: "Total videos",     value: totalVideos ?? 0,     good: true },
      ],
      alert: null,
    },
  ];

  return (
    <div className="max-w-6xl space-y-8">

      {/* ── Page heading ── */}
      <div className="border-b border-gray-200 dark:border-gray-800 pb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">RMDC Exam Prep</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Control Panel</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your platform — select a section below to get started.</p>
      </div>

      {/* ── Health strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {health.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className={`p-2.5 rounded-lg ${bg} flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 truncate">{label}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Section divider ── */}
      <div className="flex items-center gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Management Sections</p>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* ── 6 management cards ── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sections.map(({ href, icon: Icon, label, description, iconBg, stats, alert }) => (
          <Link
            key={href}
            href={href}
            className="group relative flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            {/* Alert indicator */}
            {alert && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800/40">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 truncate">{alert}</p>
              </div>
            )}

            <div className="flex flex-col flex-1 p-5">
              {/* Icon + arrow */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              {/* Label + description */}
              <h2 className="font-bold text-gray-900 dark:text-white mb-1.5">{label}</h2>
              <p className="text-sm text-gray-400 leading-relaxed flex-1">{description}</p>

              {/* Stats row */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                {stats.map(({ label: statLabel, value, good }) => (
                  <div key={statLabel}>
                    <p className={`text-base font-bold ${good ? "text-gray-900 dark:text-white" : "text-amber-500"}`}>
                      {value}
                    </p>
                    <p className="text-[11px] text-gray-400">{statLabel}</p>
                  </div>
                ))}
                <div className="ml-auto">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
                    Manage →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Quick tip ── */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
        <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-400">
          <span className="font-semibold">Tip:</span> Start by adding questions and creating exams, then publish them so students can practice.
        </p>
      </div>
    </div>
  );
}
