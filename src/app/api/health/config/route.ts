import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    authSecret: Boolean(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
    appUrl: Boolean(process.env.AUTH_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL),
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
  const missing = Object.entries(checks).filter(([, configured]) => !configured).map(([name]) => name);
  return NextResponse.json(
    { ok: missing.length === 0, checks, missing },
    { status: missing.length === 0 ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
