import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { claimAutomation, emitAutomationEvent } from "@/lib/automation";
import { sendAutomationEmail } from "@/lib/email";

export const maxDuration = 60;

/** A checkout the user never completed is cleared after this long. */
const PENDING_PAYMENT_TTL_MS = 24 * 60 * 60 * 1000;

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && req.headers.get("authorization") === `Bearer ${secret}`);
}

/**
 * Removes abandoned checkouts. A payment row is created when the user is sent
 * to AfriPay and only leaves "pending" when the webhook confirms it, so a row
 * still pending a day later was never paid.
 *
 * Every row is logged before deletion: if a late callback ever does arrive for
 * one, the webhook answers payment_not_found and the log is the only remaining
 * trace of it.
 */
async function purgeStalePendingPayments(now: Date) {
  const cutoff = new Date(now.getTime() - PENDING_PAYMENT_TTL_MS).toISOString();

  const { data: stale, error: selectError } = await supabase
    .from("payments")
    .select("id, user_id, amount, currency, plan, created_at")
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .limit(500);

  if (selectError) {
    console.error("[PURGE_PENDING_PAYMENT] select failed", selectError);
    return 0;
  }
  if (!stale?.length) return 0;

  for (const payment of stale) {
    console.log("[PURGE_PENDING_PAYMENT]", JSON.stringify(payment));
  }

  // The status filter is re-applied on delete so a payment completed by a
  // webhook between the select and here is never removed.
  const { data: deleted, error: deleteError } = await supabase
    .from("payments")
    .delete()
    .in("id", stale.map((payment) => payment.id))
    .eq("status", "pending")
    .select("id");

  if (deleteError) {
    console.error("[PURGE_PENDING_PAYMENT] delete failed", deleteError);
    return 0;
  }
  return deleted?.length ?? 0;
}

async function notify(user: { id: string; email: string; name: string | null }, type: string, key: string, title: string, message: string, path: string) {
  if (!(await claimAutomation(user.id, type, key))) return false;
  await Promise.allSettled([
    supabase.from("notifications").insert({ user_id: user.id, title, message, type: "automation" }),
    sendAutomationEmail(user.email, title, title, message, "Open MedLicense", path),
    emitAutomationEvent({ type, userId: user.id, data: { email: user.email, name: user.name, title, message, path } }),
  ]);
  return true;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const inThreeDays = new Date(now.getTime() + 3 * 86_400_000).toISOString();
  const inactiveBefore = new Date(now.getTime() - 7 * 86_400_000).toISOString();

  await supabase.from("subscriptions").update({ status: "EXPIRED" })
    .in("status", ["ACTIVE", "TRIAL"]).lt("end_date", now.toISOString());

  const [{ data: expiring }, { data: inactive }] = await Promise.all([
    supabase.from("subscriptions").select("end_date, user:users(id,email,name)")
      .in("status", ["ACTIVE", "TRIAL"]).gte("end_date", now.toISOString()).lte("end_date", inThreeDays).limit(100),
    supabase.from("users").select("id,email,name,last_login_at").eq("role", "STUDENT").eq("is_banned", false)
      .lt("last_login_at", inactiveBefore).limit(100),
  ]);

  let sent = 0;
  for (const row of expiring ?? []) {
    const user = Array.isArray(row.user) ? row.user[0] : row.user;
    if (user && await notify(user, "subscription_expiring", `subscription-expiring:${today}`, "Your MedLicense access expires soon", "Renew now to keep your exam history, analytics, and unlimited practice access active.", "/subscription")) sent++;
  }
  for (const user of inactive ?? []) {
    if (await notify(user, "study_reminder", `study-reminder:${today}`, "Ready for your next study session?", "A short focused practice session today can keep your preparation moving forward.", "/dashboard")) sent++;
  }

  await supabase.from("automation_deliveries").delete().lt("created_at", new Date(now.getTime() - 90 * 86_400_000).toISOString());
  const purgedPayments = await purgeStalePendingPayments(now);

  return NextResponse.json({
    ok: true,
    processed: (expiring?.length ?? 0) + (inactive?.length ?? 0),
    sent,
    purgedPayments,
  });
}
