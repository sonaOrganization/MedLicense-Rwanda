"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null };
  children: React.ReactNode;
}

export function DashboardLayoutClient({ user, children }: Props) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => { setMobileNavOpen(false); }, [pathname]);

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
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
