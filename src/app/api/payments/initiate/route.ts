import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const PLANS: Record<string, { amount: number; currency: string; months: number }> = {
  basic: { amount: 1500, currency: "RWF", months: 1 },
  pro:   { amount: 4000, currency: "RWF", months: 1 },
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await req.json();
  const plan = PLANS[planId];
  if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const { data: payment } = await supabase
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

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback?paymentId=${payment!.id}`;

  return NextResponse.json({
    redirectUrl: `https://pay.afripay.africa/checkout?amount=${plan.amount}&currency=${plan.currency}&ref=${payment!.id}&callback=${encodeURIComponent(callbackUrl)}`,
  });
}
