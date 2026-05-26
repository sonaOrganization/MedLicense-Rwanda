import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { registerSchema } from "@/lib/validations";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 86400000); // 24h

    await prisma.$transaction([
      prisma.user.create({
        data: { name, email, password: hashed },
      }),
      prisma.verificationToken.create({
        data: { identifier: email, token, expires },
      }),
    ]);

    await sendVerificationEmail(email, token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
