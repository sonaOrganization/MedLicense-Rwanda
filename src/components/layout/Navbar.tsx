"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Menu, X, Moon, Sun, Stethoscope, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "Free Trial", href: "/free-trial" },
  { label: "Tutorials", href: "/tutorials" },
  { label: "FAQ", href: "/faq" },
];

export function Navbar() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-300",
          scrolled
            ? "bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl shadow-sm border-b border-gray-100 dark:border-gray-800/60"
            : "bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[60px] sm:h-[68px]">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-700 flex items-center justify-center shadow-md">
                <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="leading-none">
                <span className="font-bold text-[16px] sm:text-[17px] text-gray-900 dark:text-white tracking-tight">Med</span>
                <span className="font-bold text-[16px] sm:text-[17px] text-blue-700 dark:text-blue-400 tracking-tight">License</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative px-3.5 py-2 text-[13.5px] font-medium rounded-lg transition-colors duration-150",
                      active
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-gray-800/60"
                    )}
                  >
                    {link.label}
                    {active && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-blue-700 dark:bg-blue-400" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
              </button>

              {/* Desktop CTA */}
              <div className="hidden lg:flex items-center gap-2 ml-1">
                <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
                {status === "authenticated" && session ? (
                  <Link href="/dashboard">
                    <Button size="sm" className="h-9 px-4 text-[13px] font-semibold gap-1.5">
                      <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                    </Button>
                  </Link>
                ) : status === "unauthenticated" ? (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" size="sm" className="h-9 px-4 text-[13px] font-medium text-gray-700 dark:text-gray-300">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button size="sm" className="h-9 px-5 text-[13px] font-semibold bg-blue-700 hover:bg-blue-800 text-white shadow-sm">
                        Get Started Free
                      </Button>
                    </Link>
                  </>
                ) : null}
              </div>

              {/* Mobile hamburger */}
              <button
                className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute right-0 top-0 h-full w-[78vw] max-w-[320px] bg-gray-950 shadow-2xl border-l border-gray-800/60 flex flex-col">

            {/* Drawer header */}
            <div className="px-5 py-4 border-b border-gray-800/60 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <div className="w-8 h-8 rounded-xl bg-blue-700 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-[15px] text-white tracking-tight">
                  Med<span className="text-blue-400">License</span>
                </span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navLinks.map(({ label, href }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl text-[14px] font-medium transition-all",
                      active
                        ? "bg-blue-700 text-white shadow-md shadow-blue-900/40"
                        : "text-gray-400 hover:bg-gray-800/80 hover:text-white"
                    )}
                  >
                    {label}
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-200" />}
                  </Link>
                );
              })}
            </nav>

            {/* CTA buttons */}
            <div className="px-4 py-4 border-t border-gray-800/60 space-y-2">
              {status === "authenticated" && session ? (
                <Link href="/dashboard" className="block" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-blue-700 hover:bg-blue-600 font-semibold gap-1.5">
                    <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                  </Button>
                </Link>
              ) : status === "unauthenticated" ? (
                <>
                  <Link href="/login" className="block" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" className="block" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-blue-700 hover:bg-blue-600 text-white font-semibold">
                      Get Started Free
                    </Button>
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
