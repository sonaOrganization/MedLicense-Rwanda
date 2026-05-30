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

// POST — AfriPay calls this URL after payment completes
// AfriPay sends: status, amount, currency, transaction_ref, payment_method, client_token
// client_token is the payment UUID we sent — this is how we identify which user paid
export async function POST(req: NextRequest) {
  let clientToken: string | null = null;
  let status: string | null = null;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    clientToken = body.client_token ?? null;
    status      = body.status ?? null;
  } else {
    // AfriPay sends form-encoded POST data
    const body = await req.formData().catch(() => new FormData());
    clientToken = body.get("client_token") as string | null;
    status      = body.get("status") as string | null;
  }

  if (!clientToken) return NextResponse.json({ error: "Missing client_token" }, { status: 400 });

  if (status === "success" || status === "completed" || status === "PAID" || status === "paid") {
    await activateSubscription(clientToken);
  }

  return NextResponse.json({ received: true });
}

// GET — fallback if AfriPay redirects with query params
export async function GET(req: NextRequest) {
  const clientToken = req.nextUrl.searchParams.get("client_token");
  const status      = req.nextUrl.searchParams.get("status") ?? "";

  if (clientToken && (status === "success" || status === "completed")) {
    await activateSubscription(clientToken);
  }

  return NextResponse.redirect(new URL("/subscription", req.url));
}
