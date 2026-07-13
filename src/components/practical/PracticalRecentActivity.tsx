import Link from "next/link";
import { CheckCircle, XCircle, ArrowRight, Stethoscope } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useT } from "@/lib/translations";
import { useLanguage } from "@/lib/language";

interface AttemptItem {
  id: string;
  examTitle: string;
  score: number | null;
  submittedAt: string | null;
}

export function PracticalRecentActivity({ attempts }: { attempts: AttemptItem[] }) {
  const { language } = useLanguage();
  const T = useT(language);

  if (attempts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
          <Stethoscope className="w-7 h-7 text-amber-400" />
        </div>
        <p className="font-semibold text-gray-900 dark:text-white mb-1">{T("practical_dash_empty")}</p>
        <p className="text-sm text-gray-400 mb-4">{T("practical_dash_empty_sub")}</p>
        <Link href="/practical/exams">
          <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors">
            {T("practical_dash_browse")} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attempts.map((attempt) => {
        const passed = (attempt.score ?? 0) >= 70;
        return (
          <Link
            key={attempt.id}
            href={`/practical/results/${attempt.id}`}
            className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
          >
            <div className={`p-2 rounded-lg flex-shrink-0 ${
              passed ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"
            }`}>
              {passed
                ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                : <XCircle className="w-4 h-4 text-red-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{attempt.examTitle}</p>
              {attempt.submittedAt && (
                <span className="text-xs text-gray-400">{formatDate(attempt.submittedAt)}</span>
              )}
            </div>

            <span className="text-base font-bold text-amber-600 dark:text-amber-400 flex-shrink-0">
              {Math.round(attempt.score ?? 0)}%
            </span>

            <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0" />
          </Link>
        );
      })}

      <Link href="/practical/exams" className="flex items-center justify-center gap-1.5 py-2 text-sm text-amber-600 dark:text-amber-400 hover:underline">
        {T("practical_dash_view_all")} <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
