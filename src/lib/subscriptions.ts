import { supabase } from "@/lib/supabase";

export async function hasPremiumAccess(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("subscriptions")
    .select("status, end_date, trial_ends_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data || !["ACTIVE", "TRIAL"].includes(data.status)) return false;
  const expiresAt = data.status === "TRIAL" ? data.trial_ends_at ?? data.end_date : data.end_date;
  return !expiresAt || new Date(expiresAt).getTime() > Date.now();
}

export async function canAccessExam(userId: string, isFree: boolean): Promise<boolean> {
  return isFree || hasPremiumAccess(userId);
}
