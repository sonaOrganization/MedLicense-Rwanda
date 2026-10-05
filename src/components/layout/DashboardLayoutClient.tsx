"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { WhatsAppButton } from "./WhatsAppButton";
import { LayoutDashboard, FileText, Bookmark, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSessionChoice } from "@/components/dashboard/overview/SessionTypeModal";
import { useLanguage } from "@/lib/language";
import { useT } from "@/lib/translations";
import styles from "./MobileDashboard.module.css";

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null };
  children: React.ReactNode;
}
export function DashboardLayoutClient({ user, children }: Props) {
  const [drawerRoute, setDrawerRoute] = useState<string | null>(null);
  const pathname = usePathname();
  const sessionChoice = useSessionChoice();
  const { language } = useLanguage();
  const T = useT(language);
  const examsHref = sessionChoice === "practical" ? "/practical/exams" : "/exams";
  const dashboardHref = sessionChoice === "practical" ? "/practical" : "/dashboard";
  const isExamPage = /^\/exams\/[^/]+/.test(pathname) || /^\/practical\/(?!exams|results)[^/]+/.test(pathname);
  return (
    <div className={cn(styles.shell, "flex h-[100dvh] bg-slate-50 dark:bg-[#07131b] overflow-hidden")}>
      <div className="hidden md:flex flex-shrink-0"><DashboardSidebar /></div>
      <Dialog.Root open={drawerRoute === pathname} onOpenChange={(open) => setDrawerRoute(open ? pathname : null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm md:hidden" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[min(20rem,85vw)] md:hidden outline-none" aria-describedby={undefined}>
            <Dialog.Title className="sr-only">{T("nav_dashboard")}</Dialog.Title>
            <DashboardSidebar onClose={() => setDrawerRoute(null)} />
          </Dialog.Content>
        </Dialog.Portal>
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <DashboardHeader user={user} onMenuClick={() => setDrawerRoute(pathname)} />
          <main id="dashboard-content" className={cn(styles.content, isExamPage && styles.examContent, "flex-1 overflow-y-auto p-4 sm:p-5 lg:p-7 pb-24 md:pb-7")}>
            {children}
          </main>
        </div>
      </Dialog.Root>
      {!isExamPage && <nav aria-label={language === "FR" ? "Navigation principale" : "Main navigation"} className={styles.navigation}>
        {[
          { href: dashboardHref, icon: LayoutDashboard, label: language === "FR" ? "Accueil" : "Home" },
          { href: examsHref, icon: FileText, label: language === "FR" ? "Examens" : "Practice" },
          { href: "/saved", icon: Bookmark, label: language === "FR" ? "Favoris" : "Saved" },
          { href: "/profile", icon: User, label: language === "FR" ? "Profil" : "Profile" },
        ].map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== dashboardHref && pathname.startsWith(href + "/"));
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn(styles.navItem, active && styles.active)}>
            <span className={styles.navIcon}><Icon size={21} strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" /></span>
            <span>{label}</span>
          </Link>;
        })}
      </nav>}
      {!isExamPage && <WhatsAppButton />}
    </div>
  );
}
