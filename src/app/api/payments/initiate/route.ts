import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getPlan } from "@/lib/plans";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await req.json();
  // Price is resolved server-side from the catalog — never trusted from the client.
  const plan = getPlan(planId);
  if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  // AfriPay's checkout requires app_id AND app_secret together; with either one
  // missing it answers "Some required params are missing!" on its own page,
  // which the user cannot act on. Fail here instead, before creating a payment
  // row that would sit pending forever.
  const appId     = process.env.AFRIPAY_PUBLIC_KEY;
  const appSecret = process.env.AFRIPAY_SECRET_KEY;
  if (!appId || !appSecret) {
    console.error(
      "[AFRIPAY_INITIATE] missing credentials —",
      `AFRIPAY_PUBLIC_KEY:${appId ? "set" : "MISSING"}`,
      `AFRIPAY_SECRET_KEY:${appSecret ? "set" : "MISSING"}`
    );
    return NextResponse.json(
      { error: "Payments are not configured yet. Please contact support." },
      { status: 503 }
    );
  }

  // Create a pending payment — the UUID becomes client_token sent to AfriPay
  // AfriPay sends client_token back in the callback so we can identify the user
  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      user_id:  session.user.id,
      amount:   plan.price,
      currency: plan.currency,
      provider: "afripay",
      plan:     plan.id,
      status:   "pending",
    })
    .select()
    .single();

  if (error || !payment) {
    return NextResponse.json({ error: "Could not create payment record" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Field names and shape come from AfriPay's own integration template. Their
  // checkout is a browser form POST that carries app_id and app_secret in the
  // page — that is their design, not a choice we can make server-side.
  return NextResponse.json({
    action: "https://www.afripay.africa/checkout/index.php",
    fields: {
      amount:       plan.price,
      currency:     plan.currency,
      comment:      plan.checkoutLabel,
      client_token: `ML_${payment.id}`,                 // our order ID; AfriPay echoes it back in the callback
      return_url:   `${appUrl}/subscription?paid=true`, // where AfriPay sends the browser afterwards
      app_id:       appId,
      app_secret:   appSecret,
    },
  });
}
