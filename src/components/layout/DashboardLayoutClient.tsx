"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
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

      {/* ── WhatsApp floating button — hidden during exams ── */}
      <a
        href="https://wa.me/250782710630"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-[#25D366] hover:bg-[#1ebe5a] active:scale-95 transition-all duration-200",
          isExamPage && "hidden"
        )}
        title="Chat with us on WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}
