import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") ?? "").trim().toLowerCase();
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const loginUrl = new URL("/login", req.nextUrl.origin);
  if (!email || !token) { loginUrl.searchParams.set("error", "invalid_verification"); return NextResponse.redirect(loginUrl); }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const identifier = `email-verification:${email}`;
  const { data: record } = await supabase.from("verification_tokens")
    .select("expires").eq("identifier", identifier).eq("token", tokenHash).maybeSingle();
  if (!record || new Date(record.expires).getTime() <= Date.now()) {
    loginUrl.searchParams.set("error", "expired_verification");
    return NextResponse.redirect(loginUrl);
  }

  const { error } = await supabase.from("users").update({ email_verified: new Date().toISOString() }).eq("email", email);
  if (error) { loginUrl.searchParams.set("error", "verification_failed"); return NextResponse.redirect(loginUrl); }
  await supabase.from("verification_tokens").delete().eq("identifier", identifier);
  loginUrl.searchParams.set("verified", "true");
  return NextResponse.redirect(loginUrl);
}
