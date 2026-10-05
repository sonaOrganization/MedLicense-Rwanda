import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const paymentId = req.nextUrl.searchParams.get("paymentId");
  if (!paymentId) return NextResponse.json({ error: "paymentId required" }, { status: 400 });
  const { data, error } = await supabase.from("payments").select("status").eq("id", paymentId).eq("user_id", session.user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Could not check payment" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  return NextResponse.json({ isPaid: data.status === "completed", status: data.status }, { headers: { "Cache-Control": "no-store" } });
}
