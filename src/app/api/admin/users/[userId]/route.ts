import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const { action } = await req.json();

  switch (action) {
    case "ban":
      await prisma.user.update({ where: { id: userId }, data: { isBanned: true } });
      break;
    case "unban":
      await prisma.user.update({ where: { id: userId }, data: { isBanned: false } });
      break;
    case "make_admin":
      await prisma.user.update({ where: { id: userId }, data: { role: "ADMIN" } });
      break;
    case "make_student":
      await prisma.user.update({ where: { id: userId }, data: { role: "STUDENT" } });
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
