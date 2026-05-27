import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const PLANS: Record<string, { amount: number; currency: string; months: number }> = {
  monthly: { amount: 15000, currency: "RWF", months: 1 },
  annual: { amount: 120000, currency: "RWF", months: 12 },
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, provider } = await req.json();
  const plan = PLANS[planId];
  if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  // Create pending payment record
  const { data: payment } = await supabase
    .from("payments")
    .insert({
      user_id: session.user.id,
      amount: plan.amount,
      currency: plan.currency,
      provider,
      plan: planId,
      status: "pending",
    })
    .select()
    .single();

  // In production, integrate actual Afripay/MoMo API here
  // Return redirect URL or prompt info
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback?paymentId=${payment!.id}`;

  if (provider === "afripay") {
    // Afripay integration placeholder
    return NextResponse.json({
      redirectUrl: `https://pay.afripay.africa/checkout?amount=${plan.amount}&currency=${plan.currency}&ref=${payment!.id}&callback=${callbackUrl}`,
    });
  }

  if (provider === "momo") {
    return NextResponse.json({
      message: "Mobile money prompt sent. Check your phone.",
      paymentId: payment!.id,
    });
  }

  if (provider === "card") {
    return NextResponse.json({
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/card?paymentId=${payment!.id}`,
    });
  }

  return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
}
