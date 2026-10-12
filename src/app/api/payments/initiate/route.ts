import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getPlan } from "@/lib/plans";
import { webhookSecret } from "@/lib/payments";
import { validCheckoutUrl } from "@/lib/checkout";
import { consumeLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const plan = getPlan(body?.planId);
  if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  const relayUrl = process.env.PAYMENT_CHECKOUT_URL;
  const relaySecret = process.env.PAYMENT_CHECKOUT_SECRET;
  const afripayAppId = process.env.AFRIPAY_APP_ID ?? process.env.AFRIPAY_PUBLIC_KEY;
  const afripayAppSecret = process.env.AFRIPAY_APP_SECRET ?? process.env.AFRIPAY_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  // Two modes: a SonaMovie relay that creates a hosted checkout server-to-server,
  // or AfriPay's own browser form. The form carries app_id and app_secret in the
  // page by AfriPay's design; only the callback secret must stay private.
  const useRelay = Boolean(relayUrl && relaySecret);
  if ((!useRelay && (!afripayAppId || !afripayAppSecret)) || !appUrl || !webhookSecret()) {
    console.error("[CHECKOUT_CONFIG] missing payment configuration");
    return NextResponse.json({ error: "Payments are not configured yet. Please contact support." }, { status: 503 });
  }
  try {
    if ((useRelay && new URL(relayUrl!).protocol !== "https:") || (process.env.NODE_ENV === "production" && new URL(appUrl).protocol !== "https:")) throw new Error("Invalid payment URL configuration");
  } catch { return NextResponse.json({ error: "Payments are not configured correctly." }, { status: 503 }); }
  if (!(await consumeLimit("checkout", session.user.id, 5, 60))) return NextResponse.json({ error: "Please wait before starting another payment." }, { status: 429 });
  const { data: payment, error } = await supabase.from("payments").insert({
    user_id: session.user.id, amount: plan.price, currency: plan.currency, provider: "afripay", plan: plan.id, status: "pending",
  }).select("id").single();
  if (error || !payment) return NextResponse.json({ error: "Could not create payment record" }, { status: 500 });
  const origin = appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl;
  if (!useRelay) {
    return NextResponse.json({
      paymentId: payment.id,
      action: "https://www.afripay.africa/checkout/index.php",
      fields: {
        amount: String(plan.price), currency: plan.currency, comment: plan.checkoutLabel,
        client_token: "ML_" + payment.id,
        return_url: origin + "/subscription?payment=" + encodeURIComponent(payment.id),
        app_id: afripayAppId, app_secret: afripayAppSecret,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  }
  try {
    const response = await fetch(relayUrl!, {
      method: "POST", redirect: "error",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + relaySecret, "Idempotency-Key": payment.id },
      body: JSON.stringify({
        amount: plan.price, currency: plan.currency, comment: plan.checkoutLabel,
        client_token: "ML_" + payment.id, plan: plan.id,
        return_url: origin + "/subscription?payment=" + encodeURIComponent(payment.id),
        webhook_url: origin + "/api/payments/webhook",
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Checkout service returned " + response.status);
    const result = await response.json();
    const checkoutUrl = validCheckoutUrl(result.checkout_url ?? result.checkoutUrl, relayUrl!);
    if (!checkoutUrl) throw new Error("Checkout service did not return an approved HTTPS URL");
    return NextResponse.json({ checkoutUrl, paymentId: payment.id }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    // Keep the order for reconciliation: a delayed provider confirmation may arrive.
    console.error("[CHECKOUT_CREATE]", err instanceof Error ? err.message : "Checkout failed");
    return NextResponse.json({ error: "Could not open checkout. Please try again or contact support." }, { status: 502 });
  }
}
