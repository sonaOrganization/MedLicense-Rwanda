import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { forgotPasswordSchema } from "@/lib/validations";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const parsed = forgotPasswordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  const email = parsed.data.email.trim().toLowerCase();
  const { data: user } = await supabase.from("users").select("id").eq("email", email).maybeSingle();

  // Return the same response for existing and unknown accounts.
  if (user) {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await supabase.from("verification_tokens").delete().eq("identifier", `password-reset:${email}`);
    const { error } = await supabase.from("verification_tokens").insert({
      identifier: `password-reset:${email}`,
      token: tokenHash,
      expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
    if (!error) {
      await sendPasswordResetEmail(email, token).catch((sendError) => {
        console.error("[PASSWORD_RESET_EMAIL]", sendError);
      });
    }
  }
  return NextResponse.json({ ok: true });
}
