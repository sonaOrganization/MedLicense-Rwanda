import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// GET /api/payments/activate — poll subscription status
// Called by the client while waiting for AfriPay's webhook to fire.
// Does NOT activate anything — only reads current DB state.
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("subscriptions")
    .select("status, end_date")
    .eq("user_id", session.user.id)
    .single();

  const isActive = data?.status === "ACTIVE" || data?.status === "TRIAL";
  return NextResponse.json({ isActive, status: data?.status ?? "FREE" });
}
