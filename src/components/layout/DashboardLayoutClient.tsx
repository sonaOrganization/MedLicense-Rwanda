"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { WhatsAppButton } from "./WhatsAppButton";
import { LayoutDashboard, FileText, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null };
  children: React.ReactNode;
}

export function DashboardLayoutClient({ user, children }: Props) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => { setMobileNavOpen(false); }, [pathname]);

  // Hide bottom nav and WhatsApp button when taking an exam (exam engine has its own full-screen UI)
  const isExamPage = /^\/exams\/[^/]+/.test(pathname);

  return (
    <div className="flex h-[100dvh] bg-gray-50 dark:bg-[#0a0d16] overflow-hidden" suppressHydrationWarning>

      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex flex-shrink-0">
        <DashboardSidebar />
      </div>

      {/* ── Mobile drawer backdrop ── */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 md:hidden
        transform transition-transform duration-300 ease-in-out
        ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <DashboardSidebar onClose={() => setMobileNavOpen(false)} />
      </div>

      {/* ── Main column ── */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <DashboardHeader user={user} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-7 pb-24 md:pb-7">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav — hidden during exams ── */}
      <nav className={cn("fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800", isExamPage && "hidden")}>
        <div className="flex items-stretch h-16">
          {[
            { href: "/dashboard",     icon: LayoutDashboard, label: "Dashboard"     },
            { href: "/exams",         icon: FileText,        label: "Exams"         },
            { href: "/subscription",  icon: CreditCard,      label: "Subscription"  },
          ].map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                  active
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                )}
              >
                <Icon className={cn("w-5 h-5", active && "text-indigo-600 dark:text-indigo-400")} />
                {label}
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* WhatsApp button — hidden during exams */}
      {!isExamPage && <WhatsAppButton />}
    </div>
  );
}
