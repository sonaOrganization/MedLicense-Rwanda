"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Users, FileQuestion, FileText,
  CreditCard, BarChart2, Video,
  LogOut, Stethoscope, Shield, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { label: "Overview",           href: "/admin",            icon: LayoutDashboard },
  { label: "Questions",          href: "/admin/questions",  icon: FileQuestion    },
  { label: "Exams",              href: "/admin/exams",      icon: FileText        },
  { label: "Users",              href: "/admin/users",      icon: Users           },
  { label: "Payments",           href: "/admin/payments",   icon: CreditCard      },
  { label: "Analytics",          href: "/admin/analytics",  icon: BarChart2       },
  { label: "Content Management", href: "/admin/content",    icon: Video           },
];

interface Props {
  onClose?: () => void;
}

export function AdminSidebar({ onClose }: Props) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-full w-full md:w-60 bg-gray-950 border-r border-gray-800/60">

      {/* Logo + close button (mobile) */}
      <div className="px-5 py-5 border-b border-gray-800/60 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5 group" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <div className="leading-none">
            <span className="font-bold text-[15px] text-white tracking-tight">Med</span>
            <span className="font-bold text-[15px] text-indigo-400 tracking-tight">License Admin</span>
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

      {/* Admin badge */}
      <div className="px-5 py-3 border-b border-gray-800/40">
        <div className="inline-flex items-center gap-1.5 bg-indigo-950/60 border border-indigo-800/50 rounded-lg px-2.5 py-1">
          <Shield className="w-3 h-3 text-indigo-400" />
          <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wide">Administrator</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {adminNavItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
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
              <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-white" : "text-gray-600")} />
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
          className="flex items-center gap-3 w-full px-3 py-3 md:py-2.5 rounded-xl text-[14px] md:text-[13.5px] font-medium text-gray-500 hover:bg-red-950/40 hover:text-red-400 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
