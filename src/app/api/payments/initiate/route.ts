import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const PLANS: Record<string, { amount: number; currency: string; months: number; label: string }> = {
  basic: { amount: 1500, currency: "RWF", months: 1, label: "MedLicense Basic Plan" },
  pro:   { amount: 4000, currency: "RWF", months: 1, label: "MedLicense Pro Plan" },
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await req.json();
  const plan = PLANS[planId];
  if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  // Create a pending payment — the UUID becomes client_token sent to AfriPay
  // AfriPay sends client_token back in the callback so we can identify the user
  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      user_id:  session.user.id,
      amount:   plan.amount,
      currency: plan.currency,
      provider: "afripay",
      plan:     planId,
      status:   "pending",
    })
    .select()
    .single();

  if (error || !payment) {
    return NextResponse.json({ error: "Could not create payment record" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Return the form fields — client will build and submit the form to AfriPay
  return NextResponse.json({
    action: "https://www.afripay.africa/checkout/index.php",
    fields: {
      amount:       plan.amount,
      currency:     plan.currency,
      comment:      plan.label,
      client_token: `ML_${payment.id}`,                 // ML_ prefix identifies MedLicense payments in shared callback
      return_url:   `${appUrl}/subscription?paid=true`, // redirect after payment
      app_id:       process.env.AFRIPAY_PUBLIC_KEY,
      app_secret:   process.env.AFRIPAY_SECRET_KEY,
    },
  });
}
