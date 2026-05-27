"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, Trophy, Calendar } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { useT } from "@/lib/translations";

interface CategoryStat {
  name: string;
  avgScore: number;
  attempts: number;
  passRate: number;
}

interface AttemptBar {
  id: string;
  score?: number;
  passingScore: number;
}

interface Props {
  totalAttempts: number;
  avgScore: number;
  passRate: number;
  passed: number;
  categoryStats: CategoryStat[];
  attemptBars: AttemptBar[];
}

export function AnalyticsClient({ totalAttempts, avgScore, passRate, passed, categoryStats, attemptBars }: Props) {
  const { language } = useLanguage();
  const T = useT(language);

  const summaryCards = [
    { label: T("analytics_total"),  value: totalAttempts,              icon: Target,     color: "text-indigo-500" },
    { label: T("analytics_avg"),    value: `${Math.round(avgScore)}%`, icon: TrendingUp, color: "text-green-500" },
    { label: T("analytics_rate"),   value: `${passRate}%`,             icon: Trophy,     color: "text-yellow-500" },
    { label: T("analytics_passed"), value: passed,                     icon: Calendar,   color: "text-purple-500" },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{T("analytics_title")}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{T("analytics_sub")}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>{T("analytics_by_cat")}</CardTitle></CardHeader>
        <CardContent>
          {categoryStats.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">{T("analytics_empty")}</p>
          ) : (
            <div className="space-y-5">
              {categoryStats.map(({ name, avgScore: avg, attempts, passRate: pr }) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{name}</span>
                      <span className="text-xs text-gray-400 ml-2">{attempts} {T("analytics_exams")}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{avg}%</span>
                      <span className="text-xs text-gray-400 ml-2">({pr}% {T("analytics_pr")})</span>
                    </div>
                  </div>
                  <Progress value={avg} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalAttempts > 1 && (
        <Card>
          <CardHeader><CardTitle>{T("analytics_prog")}</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32">
              {attemptBars.slice(-20).map((a) => {
                const h = Math.round(((a.score ?? 0) / 100) * 100);
                return (
                  <div key={a.id} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                      className={`w-full rounded-t transition-all ${(a.score ?? 0) >= a.passingScore ? "bg-green-400" : "bg-red-400"}`}
                      style={{ height: `${h}%` }}
                      title={`${Math.round(a.score ?? 0)}%`}
                    />
                    <span className="text-xs text-gray-400 hidden group-hover:block">{Math.round(a.score ?? 0)}%</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              {T("analytics_last")} {Math.min(totalAttempts, 20)} {T("analytics_scores")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
