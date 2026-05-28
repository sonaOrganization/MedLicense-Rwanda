import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  FileQuestion, FileText, Users, CreditCard,
  BarChart2, Video, ArrowRight, CheckCircle,
  Clock, TrendingUp, AlertCircle, Shield,
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

  const health = [
    { label: "Active Users",         value: (totalUsers ?? 0).toLocaleString(),          icon: Users,       color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-900/20"     },
    { label: "Subscriptions",        value: (activeSubscriptions ?? 0).toLocaleString(),  icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Exams Completed",      value: (totalAttempts ?? 0).toLocaleString(),        icon: TrendingUp,  color: "text-purple-600 dark:text-purple-400",  bg: "bg-purple-50 dark:bg-purple-900/20"  },
    { label: "Revenue",              value: `${(totalRevenue / 1000).toFixed(0)}K RWF`,   icon: CreditCard,  color: "text-amber-600 dark:text-amber-400",    bg: "bg-amber-50 dark:bg-amber-900/20"    },
  ];

  const sections = [
    {
      href: "/admin/questions",
      icon: FileQuestion,
      label: "Questions",
      description: "Create, review, and approve exam questions.",
      iconBg: "bg-blue-600",
      stats: [
        { label: "Approved", value: totalQuestions ?? 0 },
        { label: "Pending",  value: pendingQuestions ?? 0, warn: (pendingQuestions ?? 0) > 0 },
      ],
      alert: (pendingQuestions ?? 0) > 0 ? `${pendingQuestions} awaiting approval` : null,
    },
    {
      href: "/admin/exams",
      icon: FileText,
      label: "Exams",
      description: "Publish, draft, and configure mock exams.",
      iconBg: "bg-purple-600",
      stats: [
        { label: "Published", value: publishedExams ?? 0 },
        { label: "Drafts",    value: draftExams ?? 0 },
      ],
      alert: null,
    },
    {
      href: "/admin/users",
      icon: Users,
      label: "Users",
      description: "Manage student accounts and roles.",
      iconBg: "bg-emerald-600",
      stats: [
        { label: "Accounts",   value: totalUsers ?? 0 },
        { label: "Subscribed", value: activeSubscriptions ?? 0 },
      ],
      alert: null,
    },
    {
      href: "/admin/payments",
      icon: CreditCard,
      label: "Payments",
      description: "Track revenue and payment transactions.",
      iconBg: "bg-amber-500",
      stats: [
        { label: "Revenue", value: `${(totalRevenue / 1000).toFixed(0)}K` },
        { label: "Active",  value: activeSubscriptions ?? 0 },
      ],
      alert: null,
    },
    {
      href: "/admin/analytics",
      icon: BarChart2,
      label: "Analytics",
      description: "Monitor platform metrics and performance.",
      iconBg: "bg-rose-500",
      stats: [
        { label: "Attempts", value: totalAttempts ?? 0 },
        { label: "Users",    value: totalUsers ?? 0 },
      ],
      alert: null,
    },
    {
      href: "/admin/content",
      icon: Video,
      label: "Content",
      description: "Upload and publish tutorial videos.",
      iconBg: "bg-cyan-600",
      stats: [
        { label: "Published", value: publishedVideos ?? 0 },
        { label: "Total",     value: totalVideos ?? 0 },
      ],
      alert: null,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-8">

      {/* ── Page heading ── */}
      <div className="flex items-start gap-3 pb-4 sm:pb-6 border-b border-gray-200 dark:border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400 mb-0.5">MedLicense</p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">Admin Control Panel</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Select a section below to manage your platform.</p>
        </div>
      </div>

      {/* ── KPI strip — 2×2 on mobile, 4-col on lg ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {health.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className={`p-2 sm:p-2.5 rounded-lg ${bg} flex-shrink-0`}>
              <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-400 truncate leading-none mb-0.5">{label}</p>
              <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate leading-none">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3">
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Management Sections</p>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* ── Section cards — 2-col on mobile, 3-col on lg ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        {sections.map(({ href, icon: Icon, label, description, iconBg, stats, alert }) => (
          <Link
            key={href}
            href={href}
            className="group relative flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden active:scale-[0.98]"
          >
            {/* Alert banner */}
            {alert && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800/40">
                <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                <p className="text-[10px] sm:text-xs font-medium text-amber-700 dark:text-amber-400 truncate">{alert}</p>
              </div>
            )}

            <div className="flex flex-col flex-1 p-3.5 sm:p-5">
              {/* Icon row */}
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl ${iconBg} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all mt-0.5" />
              </div>

              {/* Label + description */}
              <h2 className="font-bold text-[13px] sm:text-base text-gray-900 dark:text-white mb-1 leading-snug">{label}</h2>
              <p className="text-[11px] sm:text-sm text-gray-400 leading-relaxed flex-1 line-clamp-2">{description}</p>

              {/* Stats */}
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                {stats.map(({ label: sl, value, warn = false }) => (
                  <div key={sl}>
                    <p className={`text-sm sm:text-base font-bold leading-none ${warn ? "text-amber-500" : "text-gray-900 dark:text-white"}`}>
                      {value}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{sl}</p>
                  </div>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Quick tip ── */}
      <div className="flex items-start gap-2.5 p-3.5 sm:p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
        <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400">
          <span className="font-semibold">Tip:</span> Start by adding questions and creating exams, then publish them so students can practice.
        </p>
      </div>
    </div>
  );
}
