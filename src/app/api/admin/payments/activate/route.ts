import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
export async function POST() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ error: "Payment activation requires a verified provider webhook." }, { status: 410 });
}
