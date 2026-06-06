import { supabase } from "@/lib/supabase";
import { Star, MessageSquare, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  general:      "General",
  exam_content: "Exam Content",
  ui_ux:        "UI / UX",
  subscription: "Subscription",
  bug_report:   "Bug Report",
};

const STAR_COLORS = ["", "text-red-400", "text-orange-400", "text-amber-400", "text-lime-400", "text-emerald-400"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <Star key={n} className={cn("w-3.5 h-3.5", n <= rating ? STAR_COLORS[rating] + " fill-current" : "text-gray-700")} />
      ))}
    </span>
  );
}

export default async function AdminFeedbackPage() {
  const { data: rows } = await supabase
    .from("feedback")
    .select("*, user:users(name, email, license_category)")
    .order("created_at", { ascending: false })
    .limit(500);

  const feedback = (rows ?? []) as {
    id: string;
    rating: number;
    category: string;
    message: string | null;
    created_at: string;
    user: { name?: string; email: string; license_category?: string } | null;
  }[];

  const total    = feedback.length;
  const avgRating = total ? +(feedback.reduce((s, f) => s + f.rating, 0) / total).toFixed(1) : 0;

  // Rating distribution
  const dist = [5,4,3,2,1].map((star) => {
    const count = feedback.filter((f) => f.rating === star).length;
    return { star, count, pct: total ? Math.round((count / total) * 100) : 0 };
  });

  // Category breakdown
  const catMap: Record<string, number> = {};
  feedback.forEach((f) => { catMap[f.category] = (catMap[f.category] ?? 0) + 1; });
  const categories = Object.entries(catMap).sort(([,a],[,b]) => b - a);

  return (
    <div className="max-w-6xl space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-pink-600 flex items-center justify-center shadow-sm">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Feedback</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} submission{total !== 1 ? "s" : ""} from students</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Avg rating */}
        <div className="col-span-2 lg:col-span-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <Star className="w-7 h-7 text-amber-400 fill-amber-400" />
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{avgRating}</p>
            <p className="text-xs text-gray-400 mt-0.5">Avg rating / 5</p>
          </div>
        </div>

        {/* Total */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
            <p className="text-xs text-gray-400 mt-0.5">Total submissions</p>
          </div>
        </div>

        {/* 5-star count */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{dist[0].count}</p>
            <p className="text-xs text-gray-400 mt-0.5">5-star ratings</p>
          </div>
        </div>

        {/* Rating distribution */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Distribution</p>
          <div className="space-y-1.5">
            {dist.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-500 w-4 text-right">{star}</span>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                  <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[11px] text-gray-400 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Feedback table */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">All Feedback</h2>
          </div>
          {feedback.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No feedback submitted yet.</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[560px] overflow-y-auto">
              {feedback.map((f) => (
                <div key={f.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {f.user?.name ?? "Student"}
                        </p>
                        <Stars rating={f.rating} />
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                          {CATEGORY_LABELS[f.category] ?? f.category}
                        </span>
                      </div>
                      {f.message && (
                        <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{f.message}</p>
                      )}
                      {!f.message && (
                        <p className="mt-1 text-xs text-gray-400 italic">No message</p>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                      {fmtDate(f.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">By Category</h2>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {categories.map(([cat, count]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {CATEGORY_LABELS[cat] ?? cat}
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="h-1.5 rounded-full bg-indigo-500"
                      style={{ width: `${Math.round((count / total) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent high-rated */}
          {feedback.filter((f) => f.rating === 5 && f.message).length > 0 && (
            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Top Reviews</p>
              <div className="space-y-3">
                {feedback.filter((f) => f.rating === 5 && f.message).slice(0, 3).map((f) => (
                  <div key={f.id} className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                    <Stars rating={5} />
                    <p className="mt-1.5 text-xs text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">{f.message}</p>
                    <p className="mt-1 text-[10px] text-gray-400">{f.user?.name ?? "Student"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
