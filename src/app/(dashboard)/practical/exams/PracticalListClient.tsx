"use client";
import Link from "next/link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderOpen, ListChecks, Lock, Stethoscope } from "lucide-react";
import { useLanguage, t } from "@/lib/language";
import { useT } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { FlagIcon } from "@/components/ui/FlagIcon";

interface Category { name_en: string; name_fr?: string | null; }
interface PracticalExam {
  id: string;
  title_en: string;
  title_fr?: string | null;
  description?: string | null;
  target_language?: string | null;
  is_free: boolean;
  total_groups: number;
  total_subquestions: number;
  category: Category | Category[] | null;
  attemptStatus: "IN_PROGRESS" | "COMPLETED" | null;
  lastScore: number | null;
}

interface Props {
  exams: PracticalExam[];
  isPremium: boolean;
}

type LangFilter = "ALL" | "EN" | "FR";

export function PracticalListClient({ exams, isPremium }: Props) {
  const { language } = useLanguage();
  const T = useT(language);
  const [langFilter, setLangFilter] = useState<LangFilter>("ALL");

  const enCount = exams.filter((e) => (e.target_language ?? "EN") === "EN").length;
  const frCount = exams.filter((e) => e.target_language === "FR").length;

  const filtered = langFilter === "ALL"
    ? exams
    : exams.filter((e) =>
        langFilter === "FR"
          ? e.target_language === "FR"
          : (e.target_language ?? "EN") === "EN"
      );

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{T("practical_exams_title")}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{T("practical_exams_sub")}</p>
      </div>

      {/* Language filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { value: "ALL" as LangFilter, label: "All Cases", count: exams.length, flag: null },
          { value: "EN"  as LangFilter, label: "English",   count: enCount,       flag: "EN" as const },
          { value: "FR"  as LangFilter, label: "Français",  count: frCount,       flag: "FR" as const },
        ]).map((tab) => (
          <button
            key={tab.value}
            onClick={() => setLangFilter(tab.value)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
              langFilter === tab.value
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700"
            )}
          >
            {tab.flag && <FlagIcon lang={tab.flag} size={14} />}
            {tab.label}
            <span className={cn(
              "text-[11px] font-bold px-1.5 py-0.5 rounded-full",
              langFilter === tab.value
                ? "bg-white/20 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((exam) => {
          const locked = !exam.is_free && !isPremium;
          const cat = Array.isArray(exam.category) ? exam.category[0] : exam.category;
          const categoryName = t(cat?.name_en ?? "", cat?.name_fr, language);
          const title = t(exam.title_en, exam.title_fr, language);
          const ctaLabel = exam.attemptStatus === "IN_PROGRESS"
            ? T("practical_list_resume")
            : exam.attemptStatus === "COMPLETED"
            ? T("practical_list_retake")
            : T("practical_list_review");

          return (
            <Card key={exam.id} className={locked ? "opacity-80" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {categoryName && <Badge variant="info">{categoryName}</Badge>}
                    {exam.target_language === "FR" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40"><FlagIcon lang="FR" size={10} /> FR</span>
                    )}
                    {(exam.target_language === "EN" || !exam.target_language) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700"><FlagIcon lang="EN" size={10} /> EN</span>
                    )}
                  </div>
                  {exam.is_free ? (
                    <Badge variant="success">{T("practical_list_free")}</Badge>
                  ) : locked ? (
                    <Lock className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Stethoscope className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
                {exam.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{exam.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                  <span className="flex items-center gap-1">
                    <FolderOpen className="w-3.5 h-3.5" /> {exam.total_groups} {T("practical_list_cases")}
                  </span>
                  <span className="flex items-center gap-1">
                    <ListChecks className="w-3.5 h-3.5" /> {exam.total_subquestions} {T("practical_list_questions")}
                  </span>
                </div>
                {exam.attemptStatus === "COMPLETED" && exam.lastScore !== null && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
                    {T("practical_list_last_score")}: {Math.round(exam.lastScore)}%
                  </p>
                )}
                {locked ? (
                  <Link href="/subscription">
                    <Button variant="outline" className="w-full" size="sm">
                      <Lock className="w-4 h-4" /> {T("practical_list_upgrade")}
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/practical/${exam.id}`}>
                    <Button className="w-full bg-amber-600 hover:bg-amber-700" size="sm">{ctaLabel}</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <Stethoscope className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
            <p className="font-semibold text-gray-700 dark:text-gray-300">{T("practical_coming_title")}</p>
            <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">{T("practical_coming_desc")}</p>
            <Link href="/exams" className="inline-block mt-4">
              <Button variant="outline" size="sm">{T("practical_cta_theory")}</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
