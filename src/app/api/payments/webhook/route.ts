import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { parsePaymentPayload, verifyPaymentSignature } from "@/lib/payments";
import { planEndDate } from "@/lib/plans";

const paidStatuses = new Set(["success", "completed", "paid"]);

async function activate(clientToken: string, status: string, transactionId: string | null) {
  if (!clientToken.startsWith("ML_")) return null;
  if (!paidStatuses.has(status.toLowerCase())) return { activated: false };

  const paymentId = clientToken.slice(3);
  const { data: payment } = await supabase.from("payments").select("*").eq("id", paymentId).single();
  if (!payment || payment.status === "completed") return { activated: false };

  // Stack onto an unexpired subscription so a second purchase adds time
  // instead of discarding whatever the user has already paid for.
  const { data: current } = await supabase
    .from("subscriptions")
    .select("end_date, status")
    .eq("user_id", payment.user_id)
    .maybeSingle();

  const now = new Date();
  const remainingUntil =
    current && current.status === "ACTIVE" && current.end_date && new Date(current.end_date) > now
      ? new Date(current.end_date)
      : now;
  const endDate = planEndDate(payment.plan, remainingUntil);

  const { error: paymentError } = await supabase
    .from("payments")
    .update({ status: "completed", transaction_id: transactionId })
    .eq("id", paymentId)
    .eq("status", "pending");
  if (paymentError) throw paymentError;

  const { error: subscriptionError } = await supabase.from("subscriptions").upsert({
    user_id: payment.user_id,
    status: "ACTIVE",
    plan: payment.plan,
    start_date: now.toISOString(),
    end_date: endDate.toISOString(),
    auto_renew: false,
  }, { onConflict: "user_id" });
  if (subscriptionError) throw subscriptionError;
  return { activated: true };
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "MedLicense AfriPay webhook active" });
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  const rawBody = await req.text();
  const signature = req.headers.get("x-afripay-signature") ?? req.headers.get("x-webhook-signature");
  if (!verifyPaymentSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const { clientToken, status, transactionId } = parsePaymentPayload(rawBody, contentType);
  const result = await activate(clientToken, status, transactionId);
  if (!result) return NextResponse.json({ error: "Not a MedLicense payment" }, { status: 400 });
  return NextResponse.json({ received: true, ...result });
}
