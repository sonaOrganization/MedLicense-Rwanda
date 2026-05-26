"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Users, FileQuestion, FileText,
  CreditCard, BarChart2, Video, MessageSquare,
  LogOut, Stethoscope, Settings, Bell, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, section: "main" },
  { label: "Users", href: "/admin/users", icon: Users, section: "main" },
  { label: "Questions", href: "/admin/questions", icon: FileQuestion, section: "content" },
  { label: "Exams", href: "/admin/exams", icon: FileText, section: "content" },
  { label: "Videos", href: "/admin/content", icon: Video, section: "content" },
  { label: "Payments", href: "/admin/payments", icon: CreditCard, section: "ops" },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart2, section: "ops" },
  { label: "Feedback", href: "/admin/feedback", icon: MessageSquare, section: "ops" },
  { label: "Announcements", href: "/admin/announcements", icon: Bell, section: "ops" },
  { label: "Settings", href: "/admin/settings", icon: Settings, section: "system" },
];

const sections = [
  { key: "main", label: "Main" },
  { key: "content", label: "Content" },
  { key: "ops", label: "Operations" },
  { key: "system", label: "System" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-full w-60 bg-gray-950 border-r border-gray-800/60">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800/60">
        <Link href="/admin" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
            <Stethoscope className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="leading-none">
            <span className="font-bold text-[15px] text-white tracking-tight">RMDC</span>
            <span className="font-bold text-[15px] text-indigo-400 tracking-tight"> Admin</span>
          </div>
        </Link>
      </div>

      {/* Admin badge */}
      <div className="px-5 py-3 border-b border-gray-800/40">
        <div className="inline-flex items-center gap-1.5 bg-indigo-950/60 border border-indigo-800/50 rounded-lg px-2.5 py-1">
          <Shield className="w-3 h-3 text-indigo-400" />
          <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wide">Administrator</span>
        </div>
      </div>

      {/* Grouped nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-5">
        {sections.map(({ key, label }) => {
          const items = adminNavItems.filter((i) => i.section === key);
          if (items.length === 0) return null;
          return (
            <div key={key}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-700">
                {label}
              </p>
              <div className="space-y-0.5">
                {items.map(({ label: itemLabel, href, icon: Icon }) => {
                  const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150",
                        active
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/50"
                          : "text-gray-500 hover:bg-gray-800/70 hover:text-gray-200"
                      )}
                    >
                      <Icon className={cn("w-4.5 h-4.5 flex-shrink-0", active ? "text-white" : "text-gray-600")} />
                      {itemLabel}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-gray-800/60">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-gray-500 hover:bg-red-950/40 hover:text-red-400 transition-all duration-150"
        >
          <LogOut className="w-4.5 h-4.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
