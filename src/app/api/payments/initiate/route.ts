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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  // AfriPay's browser form exposes app_secret. Use a hosted SonaMovie checkout
  // created server-to-server instead; never return provider credentials.
  if (!relayUrl || !relaySecret || !appUrl || !webhookSecret()) {
    return NextResponse.json({ error: "Payments are not configured yet. Please contact support." }, { status: 503 });
  }
  try {
    if (new URL(relayUrl).protocol !== "https:" || (process.env.NODE_ENV === "production" && new URL(appUrl).protocol !== "https:")) throw new Error("Invalid payment URL configuration");
  } catch { return NextResponse.json({ error: "Payments are not configured correctly." }, { status: 503 }); }
  if (!(await consumeLimit("checkout", session.user.id, 5, 60))) return NextResponse.json({ error: "Please wait before starting another payment." }, { status: 429 });
  const { data: payment, error } = await supabase.from("payments").insert({
    user_id: session.user.id, amount: plan.price, currency: plan.currency, provider: "afripay", plan: plan.id, status: "pending",
  }).select("id").single();
  if (error || !payment) return NextResponse.json({ error: "Could not create payment record" }, { status: 500 });
  try {
    const response = await fetch(relayUrl, {
      method: "POST", redirect: "error",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + relaySecret, "Idempotency-Key": payment.id },
      body: JSON.stringify({
        amount: plan.price, currency: plan.currency, comment: plan.checkoutLabel,
        client_token: "ML_" + payment.id, plan: plan.id,
        return_url: (appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl) + "/subscription?payment=" + encodeURIComponent(payment.id),
        webhook_url: (appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl) + "/api/payments/webhook",
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Checkout service returned " + response.status);
    const result = await response.json();
    const checkoutUrl = validCheckoutUrl(result.checkout_url ?? result.checkoutUrl, relayUrl);
    if (!checkoutUrl) throw new Error("Checkout service did not return an approved HTTPS URL");
    return NextResponse.json({ checkoutUrl, paymentId: payment.id }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    // Keep the order for reconciliation: a delayed provider confirmation may arrive.
    console.error("[CHECKOUT_CREATE]", err instanceof Error ? err.message : "Checkout failed");
    return NextResponse.json({ error: "Could not open checkout. Please try again or contact support." }, { status: 502 });
  }
}
