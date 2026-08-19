import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resetPasswordSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const token = typeof body?.token === "string" ? body.token : "";
  if (!parsed.success || !email || !token) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const identifier = `password-reset:${email}`;
  const { data: record } = await supabase
    .from("verification_tokens")
    .select("expires")
    .eq("identifier", identifier)
    .eq("token", tokenHash)
    .maybeSingle();
  if (!record || new Date(record.expires).getTime() <= Date.now()) {
    return NextResponse.json({ error: "This reset link is invalid or expired" }, { status: 400 });
  }

  const password = await bcrypt.hash(parsed.data.password, 12);
  const { error } = await supabase.from("users").update({ password }).eq("email", email);
  if (error) return NextResponse.json({ error: "Could not reset password" }, { status: 500 });
  await supabase.from("verification_tokens").delete().eq("identifier", identifier);
  await supabase.from("user_sessions").delete().eq("user_id", (await supabase.from("users").select("id").eq("email", email).single()).data?.id);
  return NextResponse.json({ ok: true });
}
