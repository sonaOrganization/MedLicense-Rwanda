import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/verify-email", "/reset-password"];
const PROTECTED_PATHS = ["/dashboard", "/exams", "/results", "/analytics", "/saved", "/subscription", "/profile", "/settings"];
const ADMIN_PATHS = ["/admin"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Redirect logged-in users away from auth pages
  if (session && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    const dest = session.user.role === "ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Protect dashboard routes
  if (!session && PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL(`/login?from=${pathname}`, req.url));
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

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
