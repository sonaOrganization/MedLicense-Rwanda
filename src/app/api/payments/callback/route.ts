import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("paymentId");
  const status = req.nextUrl.searchParams.get("status") ?? "completed";

  if (!paymentId) return NextResponse.redirect(new URL("/dashboard", req.url));

  const { data: payment } = await supabase.from("payments").select("*").eq("id", paymentId).single();
  if (!payment) return NextResponse.redirect(new URL("/subscription", req.url));

  if (status === "completed" || status === "success") {
    const planMonths: Record<string, number> = { basic: 1, pro: 1 };
    const months = planMonths[payment.plan] ?? 1;
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    await supabase.from("payments").update({ status: "completed" }).eq("id", paymentId);
    await supabase.from("subscriptions").upsert(
      {
        user_id: payment.user_id,
        status: "ACTIVE",
        plan: payment.plan,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        auto_renew: false,
      },
      { onConflict: "user_id" }
    );
  }

  return NextResponse.redirect(new URL("/subscription?success=true", req.url));
}
