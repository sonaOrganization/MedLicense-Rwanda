import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { sendVerificationEmail } from "@/lib/email";
import { registerSchema } from "@/lib/validations";
import crypto from "crypto";

const smtpConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASSWORD
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, email, password, phone, licenseCategory } = parsed.data;

    const { data: existing } = await supabase.from("users").select("id").eq("email", email).single();
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    await supabase.from("users").insert({
      name,
      email,
      password: hashed,
      phone: phone ?? null,
      license_category: licenseCategory,
      // Auto-verify immediately when SMTP is not configured
      email_verified: smtpConfigured ? null : new Date().toISOString(),
    });

    // Try to send verification email only if SMTP is configured
    if (smtpConfigured) {
      try {
        const token   = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 86400000); // 24 h

        await supabase.from("verification_tokens").insert({
          identifier: email,
          token,
          expires: expires.toISOString(),
        });

        await sendVerificationEmail(email, token);
        return NextResponse.json({ ok: true, requiresVerification: true });
      } catch (emailErr) {
        console.error("[REGISTER] Email send failed, auto-verifying:", emailErr);
        // Email failed — auto-verify so the user can still log in
        await supabase
          .from("users")
          .update({ email_verified: new Date().toISOString() })
          .eq("email", email);
      }
    }

    return NextResponse.json({ ok: true, requiresVerification: false });
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
