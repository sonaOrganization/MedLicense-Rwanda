import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { parsePaymentPayload, verifyWebhookAuth, webhookSecret } from "@/lib/payments";

const paidStatuses = new Set(["success", "completed", "paid", "successful", "1", "true"]);
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "MedLicense payment webhook", configured: webhookSecret() !== null });
}
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (rawBody.length > 16384) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  const verification = verifyWebhookAuth(req.headers, rawBody);
  if (!verification.ok) return NextResponse.json({ error: "Webhook authentication failed" }, { status: verification.reason === "not_configured" ? 503 : 401 });
  const payload = parsePaymentPayload(rawBody, req.headers.get("content-type") ?? "");
  if (!payload.clientToken) return NextResponse.json({ error: "Missing client_token" }, { status: 400 });
  if (!payload.clientToken.startsWith("ML_")) return NextResponse.json({ received: true, activated: false, reason: "not_a_medlicense_payment" });
  if (!paidStatuses.has(payload.status.toLowerCase())) return NextResponse.json({ received: true, activated: false, reason: "status_not_paid" });
  if (!/^ML_[0-9a-f-]{36}$/i.test(payload.clientToken) || !payload.transactionId || payload.transactionId.length > 200 || payload.amount === null || !/^[A-Z]{3}$/.test(payload.currency ?? "")) {
    return NextResponse.json({ error: "Paid confirmations require a valid order, transaction_id, amount, and currency" }, { status: 400 });
  }
  const { data: outcome, error } = await supabase.rpc("activate_verified_payment", {
    p_payment_id: payload.clientToken.slice(3), p_transaction_id: payload.transactionId, p_amount: payload.amount, p_currency: payload.currency,
  });
  if (error) { console.error("[PAYMENT_WEBHOOK]", error); return NextResponse.json({ error: "Activation failed" }, { status: 500 }); }
  if (outcome?.reason === "payment_not_found") return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (["payment_details_mismatch", "transaction_mismatch", "payment_not_pending"].includes(outcome?.reason)) return NextResponse.json({ error: "Payment details do not match the order" }, { status: 409 });
  return NextResponse.json({ received: true, ...outcome });
}
