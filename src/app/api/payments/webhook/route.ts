import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { parsePaymentPayload, verifyWebhookAuth, webhookSecret, type PaymentPayload } from "@/lib/payments";

const paidStatuses = new Set(["success", "completed", "paid", "successful", "1", "true"]);
const ORDER_TOKEN = /^ML_([0-9a-f-]{36})$/i;
const MAX_TRACKED_CALLBACKS = 10;

/** How the caller authenticated, which tells a relayed callback from AfriPay calling us directly. */
function callbackSource(headers: Headers, queryKey: string | null): string {
  if (headers.get("x-afripay-signature") ?? headers.get("x-webhook-signature")) return "relay (signed)";
  if (headers.get("x-webhook-secret") || headers.get("authorization")) return "relay (shared secret)";
  return queryKey ? "AfriPay direct" : "unknown";
}

// Records what a rejected or ignored callback contained so mismatches with the
// provider's format can be diagnosed. Never logs secrets or the transaction ID itself.
function logIgnored(reason: string, payload: PaymentPayload, contentType: string, source: string) {
  console.warn("[PAYMENT_WEBHOOK_IGNORED]", JSON.stringify({
    reason, source, contentType, fields: payload.fields, clientToken: payload.clientToken, status: payload.status,
    rawAmount: payload.rawAmount, currency: payload.currency, hasTransactionId: Boolean(payload.transactionId),
  }));
}

/**
 * Appends this callback to the payment's metadata so admins can see on the
 * Payments page whether the provider confirmation arrived and what happened to it.
 * Best effort: tracking must never change the webhook's answer.
 */
async function trackCallback(paymentId: string, entry: Record<string, unknown>) {
  try {
    const { data } = await supabase.from("payments").select("metadata").eq("id", paymentId).maybeSingle();
    if (!data) return;
    const metadata = (data.metadata ?? {}) as Record<string, unknown>;
    const previous = Array.isArray(metadata.callbacks) ? metadata.callbacks : [];
    const callbacks = [...previous, entry].slice(-MAX_TRACKED_CALLBACKS);
    await supabase.from("payments").update({ metadata: { ...metadata, callbacks } }).eq("id", paymentId);
  } catch (err) {
    console.error("[PAYMENT_WEBHOOK_TRACK]", err instanceof Error ? err.message : err);
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "MedLicense payment webhook", configured: webhookSecret() !== null });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (rawBody.length > 16384) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  const queryKey = req.nextUrl.searchParams.get("key");
  const verification = verifyWebhookAuth(req.headers, rawBody, queryKey);
  if (!verification.ok) return NextResponse.json({ error: "Webhook authentication failed" }, { status: verification.reason === "not_configured" ? 503 : 401 });
  const contentType = req.headers.get("content-type") ?? "";
  const source = callbackSource(req.headers, queryKey);
  const payload = parsePaymentPayload(rawBody, contentType);
  if (!payload.clientToken) { logIgnored("missing_client_token", payload, contentType, source); return NextResponse.json({ error: "Missing client_token" }, { status: 400 }); }
  if (!payload.clientToken.startsWith("ML_")) return NextResponse.json({ received: true, activated: false, reason: "not_a_medlicense_payment" });
  const paymentId = payload.clientToken.match(ORDER_TOKEN)?.[1] ?? null;

  const respond = async (outcome: string, body: Record<string, unknown>, status = 200) => {
    if (outcome !== "activated" && outcome !== "already_activated") logIgnored(outcome, payload, contentType, source);
    if (paymentId) {
      const missing = [!payload.transactionId && "transaction_id", payload.amount === null && "amount", !payload.currency && "currency"].filter(Boolean);
      await trackCallback(paymentId, {
        at: new Date().toISOString(), source, status: payload.status, outcome, httpStatus: status, missing,
      });
    }
    return NextResponse.json(body, { status });
  };

  if (!paidStatuses.has(payload.status.toLowerCase())) return respond("status_not_paid", { received: true, activated: false, reason: "status_not_paid" });
  if (!paymentId || !payload.transactionId || payload.transactionId.length > 200 || payload.amount === null || !/^[A-Z]{3}$/.test(payload.currency ?? "")) {
    return respond("invalid_settlement_details", { error: "Paid confirmations require a valid order, transaction_id, amount, and currency" }, 400);
  }
  const { data: outcome, error } = await supabase.rpc("activate_verified_payment", {
    p_payment_id: paymentId, p_transaction_id: payload.transactionId, p_amount: payload.amount, p_currency: payload.currency,
  });
  if (error) { console.error("[PAYMENT_WEBHOOK]", error); return respond("activation_error", { error: "Activation failed" }, 500); }
  if (outcome?.reason === "payment_not_found") return respond("payment_not_found", { error: "Payment not found" }, 404);
  if (["payment_details_mismatch", "transaction_mismatch", "payment_not_pending"].includes(outcome?.reason)) {
    return respond(outcome.reason, { error: "Payment details do not match the order" }, 409);
  }
  return respond(outcome?.activated ? "activated" : outcome?.reason ?? "unknown", { received: true, ...outcome });
}
