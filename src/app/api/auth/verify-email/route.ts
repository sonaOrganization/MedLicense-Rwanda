import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });

  const { data: record } = await supabase.from("verification_tokens").select("*").eq("token", token).single();
  if (!record || new Date(record.expires) < new Date()) {
    return NextResponse.json({ ok: false, error: "Token invalid or expired" }, { status: 400 });
  }

  await supabase.from("users").update({ email_verified: new Date().toISOString() }).eq("email", record.identifier);
  await supabase.from("verification_tokens").delete().eq("token", token);

  return NextResponse.json({ ok: true });
}
