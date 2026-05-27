"use client";
import { Moon, Sun, ChevronDown, Menu } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useLanguage } from "@/lib/language";
import { useT } from "@/lib/translations";
import { usePathname } from "next/navigation";
import { NotificationsDropdown } from "@/components/layout/NotificationsDropdown";

interface DashboardHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onMenuClick?: () => void;
}

export function DashboardHeader({ user, onMenuClick }: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const T = useT(language);
  const pathname = usePathname();
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
    "/dashboard":   { title: T("nav_dashboard"),    subtitle: T("sub_dashboard")    },
    "/exams":       { title: T("nav_exams"),         subtitle: T("sub_exams")        },
    "/results":     { title: T("nav_results"),       subtitle: T("sub_results")      },
    "/analytics":   { title: T("nav_analytics"),     subtitle: T("sub_analytics")    },
    "/saved":       { title: T("nav_saved"),         subtitle: T("sub_saved")        },
    "/subscription":{ title: T("nav_subscription"),  subtitle: T("sub_subscription") },
    "/profile":     { title: T("nav_profile"),       subtitle: T("sub_profile")      },
  };

  const page = PAGE_TITLES[pathname] ?? { title: T("nav_dashboard"), subtitle: "" };

  return (
    <header className="h-[60px] md:h-[64px] flex items-center justify-between px-4 md:px-6 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800/60 flex-shrink-0">

      {/* Left — hamburger (mobile) + page title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-1 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col justify-center min-w-0">
          <h1 className="text-[14px] md:text-[15px] font-bold text-gray-900 dark:text-white leading-tight truncate">{page.title}</h1>
          {page.subtitle && (
            <p className="hidden sm:block text-[11px] text-gray-400 dark:text-gray-500 leading-none mt-0.5">{page.subtitle}</p>
          )}
        </div>
      </div>

      {/* Right — controls */}
      <div className="flex items-center gap-1 md:gap-1.5 flex-shrink-0">

        {/* Language toggle */}
        <button
          onClick={() => setLanguage(language === "EN" ? "FR" : "EN")}
          className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors leading-none min-w-[36px] text-center"
          aria-label="Toggle language"
        >
          {language === "EN" ? "FR" : "EN"}
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>

        {/* Notifications */}
        <NotificationsDropdown />

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-800 mx-0.5 hidden sm:block" />

        {/* User avatar + name */}
        <div className="flex items-center gap-2 pl-1 pr-1.5 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
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
