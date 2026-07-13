"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, FileText, BarChart2, Bookmark,
  CreditCard, User, LogOut, Stethoscope, Trophy, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language";
import { useT } from "@/lib/translations";
import { FeedbackWidget } from "@/components/dashboard/FeedbackWidget";
import { useSessionChoice } from "@/components/dashboard/overview/SessionTypeModal";

interface Props {
  mobile?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ onClose }: Props) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const T = useT(language);
  const sessionChoice = useSessionChoice();
  const isPractical = sessionChoice === "practical";
  const examsHref = isPractical ? "/practical/exams" : "/exams";
  const dashboardHref = isPractical ? "/practical" : "/dashboard";

  const navItems = [
    { label: T("nav_dashboard"),    href: dashboardHref,   icon: LayoutDashboard },
    { label: T("nav_exams"),        href: examsHref,       icon: FileText },
    // Theory-only — no Practical equivalent yet, so hidden while in Practical mode.
    ...(isPractical ? [] : [
      { label: T("nav_results"),      href: "/results",      icon: Trophy },
      { label: T("nav_analytics"),    href: "/analytics",    icon: BarChart2 },
      { label: T("nav_saved"),        href: "/saved",        icon: Bookmark },
    ]),
    { label: T("nav_subscription"), href: "/subscription", icon: CreditCard },
    { label: T("nav_profile"),      href: "/profile",      icon: User },
  ];

  return (
    <aside className="flex flex-col h-full w-full md:w-60 bg-gray-950 border-r border-gray-800/60">

      {/* Logo + close button (mobile) */}
      <div className="px-5 py-5 border-b border-gray-800/60 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
            <Stethoscope className="w-[18px] h-[18px] text-white" />
          </div>
          <div className="leading-none">
            <span className="font-bold text-[15px] text-white tracking-tight">Med</span>
            <span className="font-bold text-[15px] text-indigo-400 tracking-tight">License</span>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav section label */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600">{T("nav_section")}</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== dashboardHref && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-xl text-[14px] md:text-[13.5px] font-medium transition-all duration-150",
                active
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/50"
                  : "text-gray-500 hover:bg-gray-800/70 hover:text-gray-200"
              )}
            >
              <Icon className={cn("w-[18px] h-[18px] flex-shrink-0", active ? "text-white" : "text-gray-500")} />
              {label}
              {active && <span className="ml-auto w-1 h-4 rounded-full bg-indigo-300/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Feedback + Sign out */}
      <div className="px-3 py-4 border-t border-gray-800/60 space-y-0.5">
        <FeedbackWidget />
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-3 md:py-2.5 rounded-xl text-[14px] md:text-[13.5px] font-medium text-gray-500 hover:bg-red-950/40 hover:text-red-400 transition-all duration-150"
        >
          <LogOut className="w-[18px] h-[18px]" />
          {T("nav_logout")}
        </button>
      </div>
    </aside>
  );
}
