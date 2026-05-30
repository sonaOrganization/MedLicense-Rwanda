import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const planMonths: Record<string, number> = { basic: 1, pro: 1 };

async function activateSubscription(paymentId: string) {
  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (!payment || payment.status === "completed") return;

  const months = planMonths[payment.plan] ?? 1;
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + months);

  await supabase.from("payments").update({ status: "completed" }).eq("id", paymentId);
  await supabase.from("subscriptions").upsert(
    {
      user_id:    payment.user_id,
      status:     "ACTIVE",
      plan:       payment.plan,
      start_date: new Date().toISOString(),
      end_date:   endDate.toISOString(),
      auto_renew: false,
    },
    { onConflict: "user_id" }
  );
}

// GET — redirect-based callback (AfriPay sends user back here after checkout)
export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("paymentId");
  const status    = req.nextUrl.searchParams.get("status") ?? "completed";

  if (!paymentId) return NextResponse.redirect(new URL("/dashboard", req.url));

  if (status === "completed" || status === "success") {
    await activateSubscription(paymentId);
    return NextResponse.redirect(new URL("/subscription?success=true", req.url));
  }

  return NextResponse.redirect(new URL("/subscription", req.url));
}

// POST — webhook callback (AfriPay notifies server directly)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  // AfriPay sends the reference (our paymentId) and a status field
  const paymentId = body.reference ?? body.payment_id ?? body.ref;
  const status    = body.status ?? body.payment_status ?? "";

  if (!paymentId) return NextResponse.json({ error: "Missing reference" }, { status: 400 });

  if (status === "completed" || status === "success" || status === "PAID") {
    await activateSubscription(paymentId);
  }

  return NextResponse.json({ received: true });
}
