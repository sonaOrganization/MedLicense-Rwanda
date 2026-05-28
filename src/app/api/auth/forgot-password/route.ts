import { NextResponse } from "next/server";

// Password reset via email is disabled (no SMTP configured).
// Always return ok to avoid revealing which emails are registered.
export async function POST() {
  return NextResponse.json({ ok: true });
}
