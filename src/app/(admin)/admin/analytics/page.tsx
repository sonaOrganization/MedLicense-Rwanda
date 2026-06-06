import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, BarChart2, CheckCircle, TrendingUp, BookOpen, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const DIFF_CLS: Record<string, string> = {
  EASY:   "bg-emerald-100 text-emerald-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HARD:   "bg-red-100 text-red-700",
};

export default async function AdminAnalyticsPage() {
  const [
    { count: totalUsers },
    { count: totalStudents },
    { count: totalExams },
    { count: totalQuestions },
    { count: totalAttempts },
    { count: activeSubscriptions },
    { data: completedAttempts },
    { data: topExams },
    { data: recentAttempts },
    { data: examQuestionRows },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "STUDENT"),
    supabase.from("exams").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("questions").select("*", { count: "exact", head: true }).eq("is_approved", true),
    supabase.from("exam_attempts").select("*", { count: "exact", head: true }).eq("status", "COMPLETED"),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).in("status", ["ACTIVE", "TRIAL"]),
    supabase.from("exam_attempts").select("score, correct, wrong").eq("status", "COMPLETED"),
    supabase.from("exam_attempts").select("exam_id, exam:exams(title_en)").eq("status", "COMPLETED").limit(200),
    supabase
      .from("exam_attempts")
      .select("*, user:users(name), exam:exams(title_en, passing_score)")
      .eq("status", "COMPLETED")
      .order("submitted_at", { ascending: false })
      .limit(10),
    // Question usage: join exam_questions with questions
    supabase
      .from("exam_questions")
      .select("question_id, question:questions(id, text_en, difficulty, language, category:categories(name_en))")
      .limit(3000),
  ]);

  const attempts = completedAttempts ?? [];
  const avgScore = attempts.length
    ? Math.round(attempts.reduce((s: number, a: { score?: number }) => s + (a.score ?? 0), 0) / attempts.length)
    : 0;

  // Tally attempts per exam
  const examAttemptMap: Record<string, { title: string; count: number }> = {};
  (topExams ?? []).forEach((a: { exam_id: string; exam: { title_en: string } | { title_en: string }[] }) => {
    const exam = Array.isArray(a.exam) ? a.exam[0] : a.exam;
    if (!exam) return;
    if (!examAttemptMap[a.exam_id]) examAttemptMap[a.exam_id] = { title: exam.title_en, count: 0 };
    examAttemptMap[a.exam_id].count++;
  });
  const topExamsList = Object.values(examAttemptMap).sort((a, b) => b.count - a.count).slice(0, 5);

  // Tally question usage across exams
  const qUsageMap: Record<string, { text: string; difficulty: string; language: string; category: string; count: number }> = {};
  (examQuestionRows ?? []).forEach((row: {
    question_id: string;
    question: { id: string; text_en: string; difficulty: string; language: string; category: { name_en: string } | { name_en: string }[] } | null | { id: string; text_en: string; difficulty: string; language: string; category: { name_en: string } | { name_en: string }[] }[];
  }) => {
    if (!row.question_id) return;
    const q = Array.isArray(row.question) ? row.question[0] : row.question;
    if (!q) return;
    const cat = Array.isArray(q.category) ? q.category[0] : q.category;
    if (!qUsageMap[row.question_id]) {
      qUsageMap[row.question_id] = {
        text:       q.text_en ?? "",
        difficulty: q.difficulty ?? "MEDIUM",
        language:   q.language ?? "EN",
        category:   cat?.name_en ?? "—",
        count:      0,
      };
    }
    qUsageMap[row.question_id].count++;
  });
  const topQuestions = Object.values(qUsageMap).sort((a, b) => b.count - a.count).slice(0, 15);

  const stats = [
    { label: "Total Users",          value: totalUsers ?? 0,          icon: Users,       color: "text-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    { label: "Students",             value: totalStudents ?? 0,        icon: Users,       color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Published Exams",      value: totalExams ?? 0,           icon: FileText,    color: "text-purple-500",  bg: "bg-purple-50 dark:bg-purple-900/20" },
    { label: "Approved Questions",   value: totalQuestions ?? 0,       icon: BookOpen,    color: "text-yellow-500",  bg: "bg-yellow-50 dark:bg-yellow-900/20" },
    { label: "Exams Completed",      value: totalAttempts ?? 0,        icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Active Subscriptions", value: activeSubscriptions ?? 0,  icon: TrendingUp,  color: "text-cyan-500",    bg: "bg-cyan-50 dark:bg-cyan-900/20" },
    { label: "Platform Avg Score",   value: `${avgScore}%`,            icon: BarChart2,   color: "text-rose-500",    bg: "bg-rose-50 dark:bg-rose-900/20" },
  ];

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">Platform-wide performance overview</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                <div className={`p-2 rounded-lg ${bg}`}><Icon className={`w-4 h-4 ${color}`} /></div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top exams by attempts */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Most Attempted Exams</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-3">
            {topExamsList.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No exam data yet.</p>}
            {topExamsList.map((exam, i) => (
              <div key={exam.title} className="flex items-center gap-3">
                <span className="w-6 text-xs font-bold text-gray-400">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{exam.title}</p>
                  <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 mt-1.5">
                    <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${Math.round((exam.count / (topExamsList[0]?.count || 1)) * 100)}%` }} />
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">{exam.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent completions */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Recent Completions</CardTitle></CardHeader>
          <CardContent className="pt-0 divide-y divide-gray-100 dark:divide-gray-800">
            {(recentAttempts ?? []).length === 0 && <p className="text-sm text-gray-400 text-center py-6">No attempts yet.</p>}
            {(recentAttempts ?? []).map((a: {
              id: string; score?: number;
              user: { name?: string };
              exam: { title_en: string; passing_score: number };
            }) => {
              const passed = (a.score ?? 0) >= a.exam.passing_score;
              return (
                <div key={a.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{a.user?.name ?? "Student"}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[180px]">{a.exam.title_en}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{a.score ?? 0}%</span>
                    <Badge variant={passed ? "success" : "danger"}>{passed ? "Pass" : "Fail"}</Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* ── Question Usage Stats ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Question Usage Stats</h2>
          <span className="text-xs text-gray-400">Questions appearing in the most exams</span>
        </div>

        {topQuestions.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-sm text-gray-400">No exam-question data yet.</CardContent></Card>
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    {["#","Question","Category","Difficulty","Language","Used in Exams"].map((h) => (
                      <th key={h} className={cn("px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500", h === "Used in Exams" ? "text-right" : "text-left")}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {topQuestions.map((q, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 text-xs font-bold text-gray-400 w-8">#{i + 1}</td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">{q.text || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{q.category}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", DIFF_CLS[q.difficulty] ?? "bg-gray-100 text-gray-600")}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", q.language === "FR" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600")}>
                          {q.language ?? "EN"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                            <div
                              className="h-1.5 rounded-full bg-indigo-500"
                              style={{ width: `${Math.round((q.count / (topQuestions[0]?.count || 1)) * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 w-6 text-right">{q.count}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
