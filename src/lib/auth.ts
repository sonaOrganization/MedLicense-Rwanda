import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabase } from "./supabase";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      async authorize(credentials) {
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

          await supabase
            .from("users")
            .update({ last_login_at: new Date().toISOString() })
            .eq("id", user.id);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            licenseCategory: user.license_category ?? null,
            language: (user.language as string | null) ?? "EN",
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
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "STUDENT";
        token.licenseCategory = (user as { licenseCategory?: string | null }).licenseCategory ?? null;
        token.language = (user as { language?: string | null }).language ?? "EN";
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.licenseCategory = (token.licenseCategory as string | null) ?? null;
        session.user.language = (token.language as string | null) ?? "EN";
      }
      return session;
    },
  },
});
