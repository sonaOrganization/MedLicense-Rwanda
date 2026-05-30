import { NextRequest, NextResponse } from "next/server";

// AfriPay callback is handled by the other website.
// That website calls /api/payments/webhook for ML_ payments.
// This route only handles the return_url redirect after checkout.
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/subscription", req.url));
}
