"use client";
import Link from "next/link";
import { ArrowRight, Stethoscope, PlayCircle, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language";
import { useT } from "@/lib/translations";
import { PracticalStatsStrip, StatTile } from "./PracticalStatsStrip";
import { PracticalRecentActivity } from "./PracticalRecentActivity";

interface RecentAttempt {
  id: string;
  examTitle: string;
  score: number | null;
  submittedAt: string | null;
}

interface ResumeAttempt {
  examId: string;
  examTitle: string;
}

interface Props {
  userName: string;
  isPremium: boolean;
  casesAvailable: number;
  casesReviewed: number;
  accuracy: number | null;
  streak: number;
  resume: ResumeAttempt | null;
  recentAttempts: RecentAttempt[];
}

export function PracticalDashboardClient({
  userName, isPremium, casesAvailable, casesReviewed, accuracy, streak, resume, recentAttempts,
}: Props) {
  const { language } = useLanguage();
  const T = useT(language);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? T("wb_morning") : hour < 17 ? T("wb_afternoon") : T("wb_evening");

  return (
    <div className="pb-6 space-y-4 sm:space-y-6 max-w-5xl">

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-amber-600 to-orange-700 text-white px-5 py-5 sm:p-8">
        <div className="absolute right-0 top-0 w-52 h-52 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute right-16 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <p className="text-amber-100 text-xs sm:text-sm font-medium">{greeting},</p>
            <div className="flex items-center gap-1 border border-white/20 bg-white/10 rounded-full px-2 py-0.5 text-[11px] font-semibold text-amber-50">
              <Stethoscope className="w-3 h-3" />
              {T("practical_dash_badge")}
            </div>
          </div>

          <h1 className="text-xl sm:text-3xl font-bold text-white mb-1.5 sm:mb-2 leading-tight">{userName}</h1>
          <p className="text-amber-100 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-5 max-w-lg">{T("practical_sub")}</p>

          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/practical/exams">
              <Button className="bg-white text-amber-700 hover:bg-amber-50 gap-2 text-sm py-2">
                {T("practical_dash_browse")} <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            {!isPremium && (
              <Link href="/subscription">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 text-xs py-2">
                  {T("practical_dash_unlock")}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Resume banner ── */}
      {resume && (
        <Link
          href={`/practical/${resume.examId}`}
          className="flex items-center gap-3 rounded-2xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 px-4 sm:px-5 py-3.5 sm:py-4 hover:border-amber-500 dark:hover:border-amber-600 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center flex-shrink-0">
            <PlayCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{T("practical_dash_resume_banner_title")}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{resume.examTitle}</p>
          </div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 flex-shrink-0">
            {T("practical_dash_resume_banner_cta")} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <PracticalStatsStrip casesReviewed={casesReviewed} accuracy={accuracy} streak={streak} />
        <StatTile icon={FolderOpen} label={T("practical_dash_available")} value={casesAvailable} />
      </div>

      {/* ── Recent activity ── */}
      <div className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{T("practical_dash_recent")}</p>
          <p className="text-xs text-gray-400 mt-0.5">{T("practical_dash_recent_sub")}</p>
        </div>
        <div className="px-4 sm:px-6 py-2">
          <PracticalRecentActivity attempts={recentAttempts} />
        </div>
      </div>
    </div>
  );
}
