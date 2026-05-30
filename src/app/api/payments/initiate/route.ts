import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const PLANS: Record<string, { amount: number; currency: string; months: number; label: string }> = {
  basic: { amount: 1500, currency: "RWF", months: 1, label: "MedLicense Basic" },
  pro:   { amount: 4000, currency: "RWF", months: 1, label: "MedLicense Pro" },
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await req.json();
  const plan = PLANS[planId];
  if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  // Create a pending payment record — its UUID becomes the unique reference
  const { data: payment, error: insertError } = await supabase
    .from("payments")
    .insert({
      user_id: session.user.id,
      amount: plan.amount,
      currency: plan.currency,
      provider: "afripay",
      plan: planId,
      status: "pending",
    })
    .select()
    .single();

  if (insertError || !payment) {
    return NextResponse.json({ error: "Could not create payment record" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Each payment gets its own unique callback URL — same AfriPay account, different paymentId
  const callbackUrl = `${appUrl}/api/payments/callback?paymentId=${payment.id}`;
  const cancelUrl   = `${appUrl}/subscription`;

  // Call AfriPay API server-side with your secret key
  const afripayRes = await fetch("https://api.afripay.africa/v1/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.AFRIPAY_SECRET_KEY}`,
    },
    body: JSON.stringify({
      merchant_key: process.env.AFRIPAY_PUBLIC_KEY,
      amount:       plan.amount,
      currency:     plan.currency,
      reference:    payment.id,          // unique per payment — ties AfriPay callback back to this user
      description:  plan.label,
      callback_url: callbackUrl,         // AfriPay POSTs here on payment completion
      cancel_url:   cancelUrl,
    }),
  });

  if (!afripayRes.ok) {
    // Mark payment as failed so it doesn't stay pending
    await supabase.from("payments").update({ status: "failed" }).eq("id", payment.id);
    const err = await afripayRes.json().catch(() => ({}));
    console.error("[AFRIPAY_INITIATE]", err);
    return NextResponse.json({ error: "Payment gateway error. Please try again." }, { status: 502 });
  }

  const afripayData = await afripayRes.json();

  // AfriPay returns a hosted checkout URL — redirect the user there
  return NextResponse.json({ redirectUrl: afripayData.checkout_url ?? afripayData.payment_url });
}
