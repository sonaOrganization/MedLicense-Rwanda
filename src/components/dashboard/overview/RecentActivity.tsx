import Link from "next/link";
import { CheckCircle, XCircle, Clock, BookOpen, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, getGradeColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AttemptItem {
  id: string;
  examTitle: string;
  score: number | null;
  passingScore: number;
  submittedAt: Date | null;
  correct: number;
  wrong: number;
  timeTaken: number | null;
}

interface RecentActivityProps {
  attempts: AttemptItem[];
}

export function RecentActivity({ attempts }: RecentActivityProps) {
  if (attempts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-indigo-400" />
        </div>
        <p className="font-semibold text-gray-900 dark:text-white mb-1">No exams yet</p>
        <p className="text-sm text-gray-400 mb-4">Start your first practice exam to track your progress</p>
        <Link href="/exams">
          <Button size="sm" className="gap-2">
            Browse Exams <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attempts.map((attempt) => {
        const passed = (attempt.score ?? 0) >= attempt.passingScore;
        const mins = attempt.timeTaken ? Math.round(attempt.timeTaken / 60) : null;

        return (
          <Link
            key={attempt.id}
            href={`/results/${attempt.id}`}
            className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
          >
            {/* Icon */}
            <div className={`p-2 rounded-lg flex-shrink-0 ${
              passed ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"
            }`}>
              {passed
                ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                : <XCircle className="w-4 h-4 text-red-400" />}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{attempt.examTitle}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400">{formatDate(attempt.submittedAt!)}</span>
                {mins && (
                  <span className="text-xs text-gray-400 flex items-center gap-0.5">
                    <Clock className="w-3 h-3" /> {mins}m
                  </span>
                )}
                <span className="text-xs text-emerald-500">{attempt.correct}✓</span>
                <span className="text-xs text-red-400">{attempt.wrong}✗</span>
              </div>
            </div>

            {/* Score */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className={`text-base font-bold ${getGradeColor(attempt.score ?? 0, attempt.passingScore)}`}>
                {Math.round(attempt.score ?? 0)}%
              </span>
              <Badge variant={passed ? "success" : "danger"} className="text-xs px-1.5 py-0">
                {passed ? "Pass" : "Fail"}
              </Badge>
            </div>

            <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0" />
          </Link>
        );
      })}

      {attempts.length >= 5 && (
        <Link href="/results" className="flex items-center justify-center gap-1.5 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          View all results <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
