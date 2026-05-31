import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const AUTH_PATHS      = ["/login", "/register", "/forgot-password", "/verify-email", "/reset-password"];
const PROTECTED_PATHS = ["/dashboard", "/exams", "/results", "/analytics", "/saved", "/subscription", "/profile", "/settings"];
const ADMIN_PATHS     = ["/admin"];

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Redirect logged-in users away from auth pages
  if (session && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    const dest = session.user.role === "ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Protect dashboard routes
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    if (!session) return NextResponse.redirect(new URL(`/login?from=${pathname}`, req.url));
    if (session.user.role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
  }

  // Protect admin routes
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    if (session.user.role !== "ADMIN") return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Block banned users
  if (session?.user && (session.user as { isBanned?: boolean }).isBanned) {
    return NextResponse.redirect(new URL("/banned", req.url));
  }

  // ── Session conflict check ──────────────────────────────────────────────
  // If the user has a sessionId in their JWT, verify it still matches the DB.
  // When a second device of the same type logs in, the DB record is overwritten,
  // so the first device's sessionId becomes stale and they are logged out here.
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
                   || ADMIN_PATHS.some((p) => pathname.startsWith(p));

  if (session?.user && isProtected) {
    const user = session.user as unknown as Record<string, unknown>;
    const sessionId  = user.sessionId  as string | undefined;
    const deviceType = user.deviceType as string | undefined;

    if (sessionId && deviceType) {
      const { data } = await supabaseAdmin()
        .from("user_sessions")
        .select("session_id")
        .eq("user_id",    session.user.id)
        .eq("device_type", deviceType)
        .single();

      if (!data || data.session_id !== sessionId) {
        // This device's session was superseded — force logout
        const res = NextResponse.redirect(
          new URL("/login?error=session_conflict", req.url)
        );
        res.cookies.delete("authjs.session-token");
        res.cookies.delete("__Secure-authjs.session-token");
        return res;
      }
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
