import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { parsePaymentPayload, verifyPaymentSignature } from "@/lib/payments";

const planMonths: Record<string, number> = { pro: 1 };
const paidStatuses = new Set(["success", "completed", "paid"]);

async function activate(clientToken: string, status: string, transactionId: string | null) {
  if (!clientToken.startsWith("ML_")) return null;
  if (!paidStatuses.has(status.toLowerCase())) return { activated: false };

  const paymentId = clientToken.slice(3);
  const { data: payment } = await supabase.from("payments").select("*").eq("id", paymentId).single();
  if (!payment || payment.status === "completed") return { activated: false };

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + (planMonths[payment.plan] ?? 1));
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
    start_date: new Date().toISOString(),
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
