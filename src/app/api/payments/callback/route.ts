import { NextRequest, NextResponse } from "next/server";

// Browser return_url only — this is where AfriPay sends the *user* after
// checkout, not where payment results arrive. Activation happens in
// /api/payments/webhook, called server-to-server by SonaMovie.
// The subscription page then polls /api/payments/activate until it flips.
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/subscription?paid=true", req.url));
}
