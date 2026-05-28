"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, Stethoscope } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMobileNavOpen(false); }, [pathname]);

  return (
    <div className="flex h-[100dvh] bg-gray-50 dark:bg-gray-950 overflow-hidden">

      {/* Desktop sidebar */}
      <div className="flex-shrink-0 hidden md:flex">
        <AdminSidebar />
      </div>

      {/* Mobile drawer overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[72vw] max-w-[280px]">
            <AdminSidebar onClose={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      {/* Right: mobile header + scrollable content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile-only header */}
        <header className="md:hidden flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800/60 shadow-sm">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
              <Stethoscope className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-[14px] text-white tracking-tight">
              Med<span className="text-indigo-400">License</span>
              <span className="ml-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-500">Admin</span>
            </span>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
