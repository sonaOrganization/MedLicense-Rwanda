import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ ok: false }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    // Always return ok to prevent email enumeration
    if (!user) return NextResponse.json({ ok: true });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1h

    await prisma.verificationToken.upsert({
      where: { token },
      create: { identifier: `reset:${email}`, token, expires },
      update: { expires },
    });

    await sendPasswordResetEmail(email, token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[FORGOT_PASSWORD]", err);
    return NextResponse.json({ ok: true }); // Silent fail
  }
}
