import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const planMonths: Record<string, number> = { pro: 1 };

async function activateFromToken(clientToken: string, status: string) {
  // Only ML_ prefixed tokens belong to MedLicense
  if (!clientToken.startsWith("ML_")) return { ok: false, reason: "Not a MedLicense payment" };

  const isPaid = ["success", "completed", "PAID", "paid"].includes(status);
  if (!isPaid) return { ok: false, reason: "Payment not successful" };

  const paymentId = clientToken.slice(3);

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (!payment)                      return { ok: false, reason: "Payment not found" };
  if (payment.status === "completed") return { ok: true,  reason: "Already activated" };

  const months  = planMonths[payment.plan] ?? 1;
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

  return { ok: true, activated: true };
}

// POST — AfriPay calls this directly (form-encoded body)
// Set this URL as your AfriPay callback: https://medlicense.vercel.app/api/payments/afripay-callback
export async function POST(req: NextRequest) {
  let clientToken = "";
  let status      = "";

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    clientToken = body.client_token ?? "";
    status      = body.status ?? "";
  } else {
    // AfriPay sends application/x-www-form-urlencoded
    const text   = await req.text();
    const params = new URLSearchParams(text);
    clientToken  = params.get("client_token") ?? "";
    status       = params.get("status")       ?? "";
  }

  const result = await activateFromToken(clientToken, status);
  return NextResponse.json({ received: true, ...result });
}
