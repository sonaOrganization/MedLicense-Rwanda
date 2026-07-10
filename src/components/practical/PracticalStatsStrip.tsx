"use client";
import { ClipboardCheck, Target, Flame } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { useT } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface Props {
  casesReviewed: number;
  accuracy: number | null;
  streak: number;
}

export function PracticalStatsStrip({ casesReviewed, accuracy, streak }: Props) {
  const { language } = useLanguage();
  const T = useT(language);

  const stats = [
    { icon: ClipboardCheck, label: T("practical_stats_reviewed"), value: casesReviewed },
    { icon: Target,         label: T("practical_stats_accuracy"), value: accuracy !== null ? `${accuracy}%` : "—" },
    { icon: Flame,          label: T("practical_stats_streak"),   value: streak },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
      {stats.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className={cn(
            "rounded-2xl border p-3.5 sm:p-5 flex flex-col gap-2",
            "bg-amber-500/10 border-amber-500/20 bg-white dark:bg-gray-900/80"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">{label}</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-3.5 h-3.5 text-amber-500" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tabular-nums leading-none">{value}</span>
        </div>
      ))}
    </div>
  );
}
