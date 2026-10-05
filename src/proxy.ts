import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];
const PROTECTED_PATHS = ["/dashboard", "/exams", "/results", "/analytics", "/saved", "/subscription", "/profile", "/settings", "/practical"];
const matches = (pathname: string, paths: string[]) => paths.some((p) => pathname === p || pathname.startsWith(p + "/"));

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  // auth() rechecks account status, permissions, and session revocation centrally.
  if (session && matches(pathname, AUTH_PATHS)) {
    return NextResponse.redirect(new URL(session.user.role === "ADMIN" ? "/admin" : "/dashboard", req.url));
  }
  if (matches(pathname, PROTECTED_PATHS)) {
    if (!session) return NextResponse.redirect(new URL("/login?from=" + encodeURIComponent(pathname), req.url));
    if (session.user.role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
  }
  if (matches(pathname, ["/admin"])) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    if (session.user.role !== "ADMIN") return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
});
export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"] };
