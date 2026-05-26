"use client";
import { Bell, Moon, Sun, Search, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

interface DashboardHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Your exam readiness at a glance" },
  "/exams": { title: "My Exams", subtitle: "Browse and start practice sessions" },
  "/results": { title: "Results", subtitle: "Review your past exam attempts" },
  "/analytics": { title: "Analytics", subtitle: "Track your performance over time" },
  "/saved": { title: "Saved Questions", subtitle: "Your personal question bank" },
  "/tutorials": { title: "Video Tutorials", subtitle: "Learn from medical experts" },
  "/subscription": { title: "Subscription", subtitle: "Manage your plan" },
  "/profile": { title: "Profile", subtitle: "Manage your account details" },
};

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const page = pageTitles[pathname] ?? { title: "Dashboard", subtitle: "" };

  return (
    <header className="h-[64px] flex items-center justify-between px-6 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800/60 flex-shrink-0">

      {/* Left — page title */}
      <div className="flex flex-col justify-center">
        <h1 className="text-[15px] font-bold text-gray-900 dark:text-white leading-tight">{page.title}</h1>
        {page.subtitle && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-none mt-0.5">{page.subtitle}</p>
        )}
      </div>

      {/* Right — controls */}
      <div className="flex items-center gap-1.5">

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-950" />
        </button>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-800 mx-1" />

        {/* User avatar + name */}
        <div className="flex items-center gap-2.5 pl-1 pr-2 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {initials}
          </div>
          <div className="hidden sm:block leading-none">
            <p className="text-[12.5px] font-semibold text-gray-900 dark:text-white">{user?.name ?? "Student"}</p>
            <p className="text-[10.5px] text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[100px]">
              {user?.email ?? ""}
            </p>
          </div>
          <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
        </div>
      </div>
    </header>
  );
}
