import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { consumeLimit } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const token = typeof body?.token === "string" ? body.token : "";
  if (!parsed.success || !email || !token) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const tokenHash = createHash("sha256").update(token).digest("hex");
  if (!(await consumeLimit("reset-password", email, 10, 900))) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  const identifier = `password-reset:${email}`;
  const password = await bcrypt.hash(parsed.data.password, 12);
  const { data, error } = await supabase.rpc("reset_account_password", {
    p_identifier: identifier, p_token_hash: tokenHash, p_password: password,
  });
  if (error) return NextResponse.json({ error: "Could not reset password" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "This reset link is invalid or expired" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
