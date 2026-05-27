import { supabase } from "@/lib/supabase";
import { UsersClient } from "@/components/admin/UsersClient";

export default async function AdminUsersPage() {
  const { data: users } = await supabase
    .from("users")
    .select("*, subscription:subscriptions(*), exam_attempts(count)")
    .order("created_at", { ascending: false });

  const userList = (users ?? []).map((u: {
    id: string;
    name?: string | null;
    email: string;
    role: string;
    phone?: string | null;
    license_category?: string | null;
    is_banned: boolean;
    created_at: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscription: any;
    exam_attempts: { count: number }[];
  }) => {
    const sub = Array.isArray(u.subscription)
      ? (u.subscription[0] ?? null)
      : (u.subscription ?? null);

    return {
      id: u.id,
      name: u.name ?? null,
      email: u.email,
      role: u.role,
      phone: u.phone ?? null,
      license_category: u.license_category ?? null,
      is_banned: u.is_banned,
      created_at: u.created_at,
      subscription: sub ? {
        status:        sub.status        ?? null,
        plan:          sub.plan          ?? null,
        end_date:      sub.end_date      ?? null,
        trial_ends_at: sub.trial_ends_at ?? null,
        start_date:    sub.start_date    ?? null,
      } : null,
      exam_count: u.exam_attempts?.[0]?.count ?? 0,
    };
  });

  return (
    <div className="max-w-7xl">
      <UsersClient users={userList} />
    </div>
  );
}
