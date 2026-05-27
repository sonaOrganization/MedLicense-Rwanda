"use client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, FileText, Star, Lock } from "lucide-react";
import { useLanguage, t } from "@/lib/language";
import { useT } from "@/lib/translations";

interface Exam {
  id: string;
  title_en: string;
  title_fr?: string | null;
  description?: string | null;
  description_fr?: string | null;
  is_free: boolean;
  duration_minutes: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  category: any;
  questions: { count: number }[];
}

interface Props {
  exams: Exam[];
  isPremium: boolean;
}

export function ExamsClient({ exams, isPremium }: Props) {
  const { language } = useLanguage();
  const T = useT(language);

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{T("exams_title")}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{T("exams_sub")}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.map((exam) => {
          const locked = !exam.is_free && !isPremium;
          const categoryName = Array.isArray(exam.category) ? exam.category[0]?.name_en : exam.category?.name_en;
          const title = t(exam.title_en, exam.title_fr, language);
          const description = language === "FR" && exam.description_fr ? exam.description_fr : exam.description;
          return (
            <Card key={exam.id} className={locked ? "opacity-80" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  {categoryName && <Badge variant="info">{categoryName}</Badge>}
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

        {exams.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{T("exams_empty")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
