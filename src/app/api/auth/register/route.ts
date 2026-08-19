import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { registerSchema } from "@/lib/validations";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";
import { createHash, randomBytes } from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, password, phone, licenseCategory } = parsed.data;
    const email = parsed.data.email.trim().toLowerCase();

    // maybeSingle returns null (no error) when no row is found — cleaner than .single()
    const { data: existing } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    const { error } = await supabase.from("users").insert({
      name,
      email,
      password: hashed,
      phone: phone ?? null,
      license_category: licenseCategory,
      email_verified: null,
    });

    if (error) {
      console.error("[REGISTER]", error);
      return NextResponse.json({ error: "Could not create account. Please try again." }, { status: 500 });
    }

    // Send welcome email — fire-and-forget (don't block registration on email failure)
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await supabase.from("verification_tokens").insert({
      identifier: `email-verification:${email}`,
      token: tokenHash,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    sendVerificationEmail(email, token).catch((err) => console.error("[VERIFY_EMAIL]", err));
    sendWelcomeEmail(email, name).catch((err) => console.error("[WELCOME_EMAIL]", err));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
