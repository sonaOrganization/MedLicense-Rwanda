import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const planMonths: Record<string, number> = { pro: 1 };

// POST /api/payments/activate
// Fallback activation called when the user returns from AfriPay.
// Activates the most recent pending payment for the current user,
// in case the webhook from the other website hasn't fired yet.
export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Already active — nothing to do
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", session.user.id)
    .single();

  if (existing?.status === "ACTIVE" || existing?.status === "TRIAL") {
    return NextResponse.json({ activated: false, alreadyActive: true });
  }

  // Find the most recent pending payment for this user
  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("status", "pending")
    .eq("provider", "afripay")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!payment) {
    return NextResponse.json({ activated: false, reason: "No pending payment found" });
  }

  // Activate
  const months  = planMonths[payment.plan] ?? 1;
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + months);

  await supabase.from("payments").update({ status: "completed" }).eq("id", payment.id);
  await supabase.from("subscriptions").upsert(
    {
      user_id:    session.user.id,
      status:     "ACTIVE",
      plan:       payment.plan,
      start_date: new Date().toISOString(),
      end_date:   endDate.toISOString(),
      auto_renew: false,
    },
    { onConflict: "user_id" }
  );

  return NextResponse.json({ activated: true });
}

// GET /api/payments/activate — check current subscription status
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("subscriptions")
    .select("status, end_date")
    .eq("user_id", session.user.id)
    .single();

  const isActive = data?.status === "ACTIVE" || data?.status === "TRIAL";
  return NextResponse.json({ isActive, status: data?.status ?? "FREE" });
}
