import { supabase } from "@/lib/supabase";
import { NotificationsAdminClient } from "@/components/admin/NotificationsAdminClient";

export default async function AdminNotificationsPage() {
  // Count active (non-banned) students so we can show "will reach X users"
  const { count } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "STUDENT")
    .eq("is_banned", false);

  // Last 20 broadcast notifications (sample: most recent distinct titles)
  const { data: recent } = await supabase
    .from("notifications")
    .select("id, title, message, type, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  // Deduplicate by title+message to show unique broadcasts
  const seen = new Set<string>();
  const broadcasts = (recent ?? []).filter((n: { title: string; message: string }) => {
    const key = `${n.title}|||${n.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);

  return (
    <div className="max-w-3xl">
      <NotificationsAdminClient studentCount={count ?? 0} recentBroadcasts={broadcasts} />
    </div>
  );
}
