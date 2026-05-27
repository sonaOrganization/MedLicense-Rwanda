"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, FileText, BarChart2, Bookmark,
  CreditCard, User, LogOut, Stethoscope, Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Exams", href: "/exams", icon: FileText },
  { label: "Results", href: "/results", icon: Trophy },
  { label: "Progress Analytics", href: "/analytics", icon: BarChart2 },
  { label: "Saved Questions", href: "/saved", icon: Bookmark },
  { label: "Subscription Status", href: "/subscription", icon: CreditCard },
  { label: "Profile Settings", href: "/profile", icon: User },
];

export function DashboardSidebar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-gray-950 border-r border-gray-800/60",
        mobile ? "w-full" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800/60">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
            <Stethoscope className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="leading-none">
            <span className="font-bold text-[15px] text-white tracking-tight">RMDC</span>
            <span className="font-bold text-[15px] text-indigo-400 tracking-tight"> Prep</span>
          </div>
        </Link>
      </div>

      {/* Nav section label */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600">Navigation</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
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
              <Icon className={cn("w-4.5 h-4.5 flex-shrink-0", active ? "text-white" : "text-gray-500")} />
              {label}
              {active && <span className="ml-auto w-1 h-4 rounded-full bg-indigo-300/60" />}
            </Link>
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
