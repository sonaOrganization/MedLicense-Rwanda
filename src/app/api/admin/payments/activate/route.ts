import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const planMonths: Record<string, number> = { pro: 1 };

// POST /api/admin/payments/activate
// Admin-only: manually activate a pending payment by ID
// Body: { paymentId: string }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { paymentId } = await req.json();
  if (!paymentId) return NextResponse.json({ error: "paymentId required" }, { status: 400 });

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.status === "completed")
    return NextResponse.json({ ok: true, note: "Already activated" });

  const months  = planMonths[payment.plan] ?? 1;
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + months);

  await supabase.from("payments").update({ status: "completed" }).eq("id", paymentId);
  await supabase.from("subscriptions").upsert(
    {
      user_id:    payment.user_id,
      status:     "ACTIVE",
      plan:       payment.plan,
      start_date: new Date().toISOString(),
      end_date:   endDate.toISOString(),
      auto_renew: false,
    },
    { onConflict: "user_id" }
  );

  return NextResponse.json({ ok: true, activated: true, userId: payment.user_id });
}
