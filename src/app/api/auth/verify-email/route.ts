import { NextResponse } from "next/server";

// Email verification is disabled — redirect to login
export async function GET() {
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}
