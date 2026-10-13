import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getPlan } from "@/lib/plans";

// POST /api/admin/payments/activate
// Admin-only recovery for a student who paid but whose provider callback never
// activated the order. Requires the AfriPay transaction reference from the
// provider dashboard and runs the same transactional activation as the webhook.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const paymentId = typeof body?.paymentId === "string" ? body.paymentId.trim() : "";
  const reference = typeof body?.transactionRef === "string" ? body.transactionRef.trim() : "";
  if (!paymentId) return NextResponse.json({ error: "paymentId required" }, { status: 400 });
  if (reference.length < 3 || reference.length > 200) {
    return NextResponse.json({ error: "Enter the AfriPay transaction reference for this payment" }, { status: 400 });
  }
  const { data: payment, error: readError } = await supabase
    .from("payments").select("id, user_id, plan, amount, currency, status").eq("id", paymentId).maybeSingle();
  if (readError) return NextResponse.json({ error: "Could not load payment" }, { status: 500 });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.status === "completed") return NextResponse.json({ ok: true, note: "Already activated" });
  const plan = getPlan(payment.plan);
  if (plan && plan.price !== Number(payment.amount)) {
    return NextResponse.json({ error: "Payment amount does not match its plan price" }, { status: 409 });
  }
  const { data: outcome, error } = await supabase.rpc("activate_verified_payment", {
    p_payment_id: payment.id, p_transaction_id: reference, p_amount: payment.amount, p_currency: payment.currency,
  });
  if (error) { console.error("[ADMIN_ACTIVATE_PAYMENT]", error); return NextResponse.json({ error: "Activation failed. No changes were applied." }, { status: 500 }); }
  if (!outcome?.activated) return NextResponse.json({ error: "Payment could not be activated (" + (outcome?.reason ?? "unknown") + ")" }, { status: 409 });
  // Re-read so the activated_at written by the activation is kept.
  const { data: activated } = await supabase.from("payments").select("metadata").eq("id", payment.id).maybeSingle();
  await supabase.from("payments").update({
    metadata: { ...(activated?.metadata ?? {}), manual_activation: { by: session.user.id, at: new Date().toISOString() } },
  }).eq("id", payment.id);
  console.info("[ADMIN_ACTIVATE_PAYMENT]", JSON.stringify({ paymentId: payment.id, userId: payment.user_id, admin: session.user.id }));
  return NextResponse.json({ ok: true, activated: true, userId: payment.user_id, endDate: outcome.endDate });
}
