import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("paymentId");
  const status = req.nextUrl.searchParams.get("status") ?? "completed";

  if (!paymentId) return NextResponse.redirect(new URL("/dashboard", req.url));

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return NextResponse.redirect(new URL("/subscription", req.url));

  if (status === "completed" || status === "success") {
    const planMonths: Record<string, number> = { monthly: 1, annual: 12 };
    const months = planMonths[payment.plan] ?? 1;
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    await prisma.$transaction([
      prisma.payment.update({ where: { id: paymentId }, data: { status: "completed" } }),
      prisma.subscription.upsert({
        where: { userId: payment.userId },
        create: { userId: payment.userId, status: "ACTIVE", plan: payment.plan, startDate: new Date(), endDate, autoRenew: false },
        update: { status: "ACTIVE", plan: payment.plan, startDate: new Date(), endDate },
      }),
    ]);
  }

  return NextResponse.redirect(new URL("/subscription?success=true", req.url));
}
