import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const planMonths: Record<string, number> = { pro: 1 };

async function activate(clientToken: string, status: string) {
  if (!clientToken.startsWith("ML_")) return null;

  const isPaid = ["success", "completed", "PAID", "paid"].includes(status);
  if (!isPaid) return { activated: false };

  const paymentId = clientToken.slice(3);

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (!payment || payment.status === "completed") return { activated: false };

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

  return { activated: true };
}

// GET — health check so the other website can verify this endpoint exists
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "MedLicense AfriPay webhook active" });
}

// POST — called by the other website when it receives an ML_ callback from AfriPay
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let clientToken = "";
  let status      = "";

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    clientToken = body.client_token ?? "";
    status      = body.status ?? "";
  } else {
    // form-encoded (AfriPay's native format)
    const text   = await req.text();
    const params = new URLSearchParams(text);
    clientToken  = params.get("client_token") ?? "";
    status       = params.get("status")       ?? "";
  }

  const result = await activate(clientToken, status);
  if (!result) return NextResponse.json({ error: "Not a MedLicense payment" }, { status: 400 });

  return NextResponse.json({ received: true, ...result });
}
