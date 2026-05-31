import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabase } from "./supabase";
import { getDeviceType } from "./device";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      async authorize(credentials, req) {
        try {
          const { data: user, error: dbError } = await supabase
            .from("users")
            .select("id, email, name, role, password, is_banned, license_category, language")
            .eq("email", credentials.email as string)
            .single();

          if (dbError || !user || !user.password) return null;
          if (user.is_banned) throw new Error("Account suspended");

          const valid = await bcrypt.compare(credentials.password as string, user.password);
          if (!valid) return null;

          // Detect device type from user-agent
          const userAgent  = (req as Request).headers?.get?.("user-agent") ?? "";
          const deviceType = getDeviceType(userAgent);
          const sessionId  = crypto.randomUUID();

          // UPSERT session — one row per (user, device_type).
          // If the same device type logs in again, the old sessionId is replaced,
          // which immediately invalidates the previous device's session.
          await supabase.from("user_sessions").upsert(
            { user_id: user.id, session_id: sessionId, device_type: deviceType },
            { onConflict: "user_id,device_type" }
          );

          await supabase
            .from("users")
            .update({ last_login_at: new Date().toISOString() })
            .eq("id", user.id);

          return {
            id:              user.id,
            email:           user.email,
            name:            user.name,
            role:            user.role,
            licenseCategory: user.license_category ?? null,
            language:        (user.language as string | null) ?? "EN",
            sessionId,
            deviceType,
          };
        } catch (err) {
          if (err instanceof Error && err.message === "Account suspended") throw err;
          console.error("[AUTH_AUTHORIZE]", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.id             = user.id;
        token.role           = (user as { role?: string }).role ?? "STUDENT";
        token.licenseCategory = (user as { licenseCategory?: string | null }).licenseCategory ?? null;
        token.language       = (user as { language?: string | null }).language ?? "EN";
        token.sessionId      = (user as { sessionId?: string }).sessionId;
        token.deviceType     = (user as { deviceType?: string }).deviceType;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id             = token.id as string;
        session.user.role           = token.role as string;
        session.user.licenseCategory = (token.licenseCategory as string | null) ?? null;
        session.user.language       = (token.language as string | null) ?? "EN";
        (session.user as unknown as Record<string, unknown>).sessionId  = token.sessionId;
        (session.user as unknown as Record<string, unknown>).deviceType = token.deviceType;
      }
      return session;
    },
  },
  events: {
    // Clean up session record when user signs out
    async signOut(message) {
      const token = (message as { token?: Record<string, unknown> }).token;
      if (token?.id && token?.deviceType) {
        await supabase
          .from("user_sessions")
          .delete()
          .eq("user_id",    token.id as string)
          .eq("device_type", token.deviceType as string);
      }
    },
  },
});
