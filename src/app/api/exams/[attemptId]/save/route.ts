import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { attemptId } = await params;
  const body = await req.json();

  await prisma.examAttempt.updateMany({
    where: { id: attemptId, userId: session.user.id, status: "IN_PROGRESS" },
    data: { savedState: body },
  });

  return NextResponse.json({ ok: true });
}
