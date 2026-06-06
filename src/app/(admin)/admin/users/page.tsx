import { supabase } from "@/lib/supabase";
import { UsersClient } from "@/components/admin/UsersClient";

export default async function AdminUsersPage() {
  const [{ data: users }, { data: attemptData }] = await Promise.all([
    supabase
      .from("users")
      .select("*, subscription:subscriptions(*), exam_attempts(count)")
      .order("created_at", { ascending: false }),
    supabase
      .from("exam_attempts")
      .select("user_id, score, status")
      .eq("status", "COMPLETED")
      .limit(5000),
  ]);

  // Aggregate exam performance per user
  const userStats: Record<string, { count: number; totalScore: number }> = {};
  (attemptData ?? []).forEach((a: { user_id: string; score?: number }) => {
    if (!userStats[a.user_id]) userStats[a.user_id] = { count: 0, totalScore: 0 };
    userStats[a.user_id].count++;
    userStats[a.user_id].totalScore += a.score ?? 0;
  });

  const userList = (users ?? []).map((u: {
    id: string;
    name?: string | null;
    email: string;
    role: string;
    phone?: string | null;
    license_category?: string | null;
    is_banned: boolean;
    created_at: string;
    last_login_at?: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscription: any;
    exam_attempts: { count: number }[];
  }) => {
    const sub = Array.isArray(u.subscription) ? (u.subscription[0] ?? null) : (u.subscription ?? null);
    const stats = userStats[u.id];
    const avgScore = stats && stats.count > 0 ? Math.round(stats.totalScore / stats.count) : null;

    return {
      id: u.id,
      name: u.name ?? null,
      email: u.email,
      role: u.role,
      phone: u.phone ?? null,
      license_category: u.license_category ?? null,
      is_banned: u.is_banned,
      created_at: u.created_at,
      last_login_at: u.last_login_at ?? null,
      subscription: sub ? {
        status:        sub.status        ?? null,
        plan:          sub.plan          ?? null,
        end_date:      sub.end_date      ?? null,
        trial_ends_at: sub.trial_ends_at ?? null,
        start_date:    sub.start_date    ?? null,
      } : null,
      exam_count: u.exam_attempts?.[0]?.count ?? 0,
      avg_score: avgScore,
    };
  });

  return (
    <div className="max-w-7xl">
      <UsersClient users={userList} />
    </div>
  );
}
