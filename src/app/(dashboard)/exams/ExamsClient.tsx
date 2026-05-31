"use client";
import Link from "next/link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, FileText, Star, Lock } from "lucide-react";
import { useLanguage, t } from "@/lib/language";
import { useT } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface Category { name_en: string; name_fr?: string | null; }
interface Exam {
  id: string;
  title_en: string;
  title_fr?: string | null;
  description?: string | null;
  description_fr?: string | null;
  target_language?: string | null;
  is_free: boolean;
  duration_minutes: number;
  category: Category | Category[] | null;
  questions: { count: number }[];
}

interface Props {
  exams: Exam[];
  isPremium: boolean;
}

type LangFilter = "ALL" | "EN" | "FR";

export function ExamsClient({ exams, isPremium }: Props) {
  const { language } = useLanguage();
  const T = useT(language);
  const [langFilter, setLangFilter] = useState<LangFilter>("ALL");

  const enCount  = exams.filter((e) => (e.target_language ?? "EN") === "EN").length;
  const frCount  = exams.filter((e) => e.target_language === "FR").length;

  const filtered = langFilter === "ALL"
    ? exams
    : exams.filter((e) =>
        langFilter === "FR"
          ? e.target_language === "FR"
          : (e.target_language ?? "EN") === "EN"
      );

  return (
    <div className="max-w-5xl">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{T("exams_title")}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{T("exams_sub")}</p>
      </div>

      {/* Language filter tabs */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {([
          { value: "ALL" as LangFilter, label: "All Exams",      count: exams.length,  flag: null   },
          { value: "EN"  as LangFilter, label: "English",         count: enCount,        flag: "🇬🇧" },
          { value: "FR"  as LangFilter, label: "Français",        count: frCount,        flag: "🇫🇷" },
        ]).map((tab) => (
          <button
            key={tab.value}
            onClick={() => setLangFilter(tab.value)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
              langFilter === tab.value
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
            )}
          >
            {tab.flag && <span>{tab.flag}</span>}
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
          const description = language === "FR" && exam.description_fr ? exam.description_fr : exam.description;
          return (
            <Card key={exam.id} className={locked ? "opacity-80" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {categoryName && <Badge variant="info">{categoryName}</Badge>}
                    {exam.target_language === "FR" && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">🇫🇷 FR</span>
                    )}
                    {(exam.target_language === "EN" || !exam.target_language) && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">🇬🇧 EN</span>
                    )}
                  </div>
                  {exam.is_free ? (
                    <Badge variant="success">{T("exams_free")}</Badge>
                  ) : locked ? (
                    <Lock className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
                {description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> {exam.questions[0]?.count ?? 0} {T("exams_questions")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {exam.duration_minutes} {T("exams_min")}
                  </span>
                </div>
                {locked ? (
                  <Link href="/subscription">
                    <Button variant="outline" className="w-full" size="sm">
                      <Lock className="w-4 h-4" /> {T("exams_upgrade")}
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/exams/${exam.id}`}>
                    <Button className="w-full" size="sm">{T("exams_start")}</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>
              {langFilter === "FR"
                ? "No French exams available yet."
                : langFilter === "EN"
                ? "No English exams available yet."
                : T("exams_empty")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
