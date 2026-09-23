import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { parsePaymentPayload, verifyWebhookAuth, webhookSecret } from "@/lib/payments";
import { planEndDate } from "@/lib/plans";

// Canonical payment webhook. AfriPay posts to the SonaMovie server, which owns
// the AfriPay integration; SonaMovie forwards any payment whose client_token
// starts with "ML_" here, and this route grants the MedLicense subscription.
// See docs/payment-webhook.md for the contract.

const PAID_STATUSES = new Set(["success", "completed", "paid", "successful", "1", "true"]);

type Outcome =
  | { activated: true; userId: string; plan: string; endDate: string }
  | { activated: false; reason: string };

async function activate(
  clientToken: string,
  status: string,
  transactionId: string | null
): Promise<Outcome> {
  if (!clientToken.startsWith("ML_")) return { activated: false, reason: "not_a_medlicense_payment" };
  if (!PAID_STATUSES.has(status.toLowerCase())) return { activated: false, reason: `status_not_paid:${status || "empty"}` };

  const paymentId = clientToken.slice(3);
  const { data: payment } = await supabase
    .from("payments")
    .select("id, user_id, plan, status")
    .eq("id", paymentId)
    .maybeSingle();

  if (!payment) return { activated: false, reason: "payment_not_found" };
  // Replays are expected — providers retry until they see a 2xx.
  if (payment.status === "completed") return { activated: false, reason: "already_activated" };

  // Claim the payment first. The status filter makes this the atomic step:
  // a concurrent retry updates zero rows and stops here.
  const { data: claimed, error: claimError } = await supabase
    .from("payments")
    .update({ status: "completed", transaction_id: transactionId })
    .eq("id", paymentId)
    .eq("status", "pending")
    .select("id");
  if (claimError) throw claimError;
  if (!claimed?.length) return { activated: false, reason: "already_activated" };

  // Stack onto an unexpired subscription rather than discarding paid-for time.
  const { data: current } = await supabase
    .from("subscriptions")
    .select("status, end_date")
    .eq("user_id", payment.user_id)
    .maybeSingle();

  const now = new Date();
  const startFrom =
    current?.status === "ACTIVE" && current.end_date && new Date(current.end_date) > now
      ? new Date(current.end_date)
      : now;
  const endDate = planEndDate(payment.plan, startFrom);

  const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
    {
      user_id:    payment.user_id,
      status:     "ACTIVE",
      plan:       payment.plan,
      start_date: now.toISOString(),
      end_date:   endDate.toISOString(),
      auto_renew: false,
    },
    { onConflict: "user_id" }
  );
  if (subscriptionError) throw subscriptionError;

  return { activated: true, userId: payment.user_id, plan: payment.plan, endDate: endDate.toISOString() };
}

// Health check for the forwarding server — never reveals the secret itself.
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "MedLicense payment webhook",
    configured: webhookSecret() !== null,
  });
}

export async function POST(req: NextRequest) {
  const rawBody     = await req.text();
  const contentType = req.headers.get("content-type") ?? "";

  const auth = verifyWebhookAuth(req.headers, rawBody);
  if (!auth.ok) {
    if (auth.reason === "not_configured") {
      console.error("[PAYMENT_WEBHOOK] PAYMENT_WEBHOOK_SECRET is not set — rejecting all callbacks");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }
    console.warn("[PAYMENT_WEBHOOK] rejected:", auth.reason);
    return NextResponse.json({ error: "Unauthorized", reason: auth.reason }, { status: 401 });
  }

  const { clientToken, status, transactionId } = parsePaymentPayload(rawBody, contentType);
  if (!clientToken) {
    return NextResponse.json({ error: "Missing client_token" }, { status: 400 });
  }

  try {
    const outcome = await activate(clientToken, status, transactionId);
    console.log("[PAYMENT_WEBHOOK]", clientToken, JSON.stringify(outcome));
    // Always 200 once authenticated: a non-activating callback is a decision,
    // not a failure, and a non-2xx would make the sender retry forever.
    return NextResponse.json({ received: true, ...outcome });
  } catch (err) {
    // 500 so the forwarding server retries — the payment is genuinely unresolved.
    console.error("[PAYMENT_WEBHOOK] activation failed", clientToken, err);
    return NextResponse.json({ error: "Activation failed" }, { status: 500 });
  }
}
