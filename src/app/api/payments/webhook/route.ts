import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { parsePaymentPayload, verifyWebhookAuth, webhookSecret } from "@/lib/payments";

const paidStatuses = new Set(["success", "completed", "paid", "successful", "1", "true"]);
// Records what a rejected or ignored callback contained so mismatches with the
// provider's format can be diagnosed. Never logs secrets or the transaction ID itself.
function logIgnored(reason: string, payload: ReturnType<typeof parsePaymentPayload>, contentType: string) {
  console.warn("[PAYMENT_WEBHOOK_IGNORED]", JSON.stringify({
    reason, contentType, fields: payload.fields, clientToken: payload.clientToken, status: payload.status,
    rawAmount: payload.rawAmount, currency: payload.currency, hasTransactionId: Boolean(payload.transactionId),
  }));
}
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "MedLicense payment webhook", configured: webhookSecret() !== null });
}
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (rawBody.length > 16384) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  const verification = verifyWebhookAuth(req.headers, rawBody, req.nextUrl.searchParams.get("key"));
  if (!verification.ok) return NextResponse.json({ error: "Webhook authentication failed" }, { status: verification.reason === "not_configured" ? 503 : 401 });
  const contentType = req.headers.get("content-type") ?? "";
  const payload = parsePaymentPayload(rawBody, contentType);
  if (!payload.clientToken) { logIgnored("missing_client_token", payload, contentType); return NextResponse.json({ error: "Missing client_token" }, { status: 400 }); }
  if (!payload.clientToken.startsWith("ML_")) return NextResponse.json({ received: true, activated: false, reason: "not_a_medlicense_payment" });
  if (!paidStatuses.has(payload.status.toLowerCase())) { logIgnored("status_not_paid", payload, contentType); return NextResponse.json({ received: true, activated: false, reason: "status_not_paid" }); }
  if (!/^ML_[0-9a-f-]{36}$/i.test(payload.clientToken) || !payload.transactionId || payload.transactionId.length > 200 || payload.amount === null || !/^[A-Z]{3}$/.test(payload.currency ?? "")) {
    logIgnored("invalid_settlement_details", payload, contentType);
    return NextResponse.json({ error: "Paid confirmations require a valid order, transaction_id, amount, and currency" }, { status: 400 });
  }
  const { data: outcome, error } = await supabase.rpc("activate_verified_payment", {
    p_payment_id: payload.clientToken.slice(3), p_transaction_id: payload.transactionId, p_amount: payload.amount, p_currency: payload.currency,
  });
  if (error) { console.error("[PAYMENT_WEBHOOK]", error); return NextResponse.json({ error: "Activation failed" }, { status: 500 }); }
  if (outcome?.reason === "payment_not_found") return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (["payment_details_mismatch", "transaction_mismatch", "payment_not_pending"].includes(outcome?.reason)) { logIgnored(outcome.reason, payload, contentType); return NextResponse.json({ error: "Payment details do not match the order" }, { status: 409 }); }
  return NextResponse.json({ received: true, ...outcome });
}
