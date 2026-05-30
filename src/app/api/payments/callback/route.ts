import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const planMonths: Record<string, number> = { basic: 1, pro: 1 };

async function activateMedLicenseSubscription(paymentId: string) {
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

// Forward callback to the other website when client_token has no ML_ prefix
async function forwardToOtherSite(body: Record<string, string>) {
  const otherCallbackUrl = process.env.OTHER_SITE_CALLBACK_URL;
  if (!otherCallbackUrl) return;

  const params = new URLSearchParams(body);
  await fetch(otherCallbackUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  }).catch((err) => console.error("[CALLBACK_FORWARD]", err));
}

function parseToken(clientToken: string): { isMedLicense: boolean; paymentId: string } {
  if (clientToken.startsWith("ML_")) {
    return { isMedLicense: true, paymentId: clientToken.slice(3) };
  }
  return { isMedLicense: false, paymentId: clientToken };
}

// POST — AfriPay sends: status, amount, currency, transaction_ref, payment_method, client_token
export async function POST(req: NextRequest) {
  let fields: Record<string, string> = {};

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    fields = await req.json().catch(() => ({}));
  } else {
    const form = await req.formData().catch(() => new FormData());
    form.forEach((val, key) => { fields[key] = String(val); });
  }

  const clientToken = fields.client_token ?? "";
  const status      = fields.status ?? "";

  if (!clientToken) return NextResponse.json({ error: "Missing client_token" }, { status: 400 });

  const { isMedLicense, paymentId } = parseToken(clientToken);
  const isPaid = ["success", "completed", "PAID", "paid"].includes(status);

  if (isMedLicense) {
    if (isPaid) await activateMedLicenseSubscription(paymentId);
  } else {
    // Not a MedLicense payment — forward to other website's callback
    await forwardToOtherSite(fields);
  }

  return NextResponse.json({ received: true });
}

// GET — redirect fallback
export async function GET(req: NextRequest) {
  const clientToken = req.nextUrl.searchParams.get("client_token") ?? "";
  const status      = req.nextUrl.searchParams.get("status") ?? "";
  const isPaid      = ["success", "completed", "PAID", "paid"].includes(status);

  if (clientToken) {
    const { isMedLicense, paymentId } = parseToken(clientToken);
    if (isMedLicense && isPaid) await activateMedLicenseSubscription(paymentId);
  }

  return NextResponse.redirect(new URL("/subscription", req.url));
}
