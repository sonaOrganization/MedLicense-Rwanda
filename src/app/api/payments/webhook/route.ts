import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const planMonths: Record<string, number> = { pro: 1 };

// Internal webhook — called by the other website when it receives an ML_ payment from AfriPay
// Secured with WEBHOOK_SECRET so only your other website can call this
export async function POST(req: NextRequest) {
  // Verify shared secret
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  // client_token sent from AfriPay will be ML_<paymentId>
  const clientToken: string = body.client_token ?? "";
  const status: string      = body.status ?? "";

  if (!clientToken.startsWith("ML_")) {
    return NextResponse.json({ error: "Not a MedLicense payment" }, { status: 400 });
  }

  const paymentId = clientToken.slice(3); // strip ML_ prefix
  const isPaid    = ["success", "completed", "PAID", "paid"].includes(status);

  if (!isPaid) {
    return NextResponse.json({ received: true, activated: false });
  }

  // Look up the pending payment
  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.status === "completed") {
    return NextResponse.json({ received: true, activated: false, note: "Already processed" });
  }

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

  return NextResponse.json({ received: true, activated: true });
}
