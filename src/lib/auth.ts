import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
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
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
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
        if (account.provider === "google") {
          const { data: dbUser } = await supabase
            .from("users")
            .select("id, role, license_category, language")
            .eq("email", token.email!)
            .single();

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.licenseCategory = dbUser.license_category ?? null;
            token.language = (dbUser.language as string | null) ?? "EN";
          }
        } else {
          token.id = user.id;
          token.role = (user as { role?: string }).role ?? "STUDENT";
          token.licenseCategory = (user as { licenseCategory?: string | null }).licenseCategory ?? null;
          token.language = (user as { language?: string | null }).language ?? "EN";
        }
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
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const { data: existing } = await supabase
            .from("users")
            .select("id")
            .eq("email", user.email!)
            .single();

          if (!existing) {
            await supabase.from("users").insert({
              email: user.email,
              name: user.name,
              image: user.image,
              role: "STUDENT",
            });
          }
        } catch (err) {
          console.error("[AUTH_SIGNIN_GOOGLE]", err);
        }
      }
      return true;
    },
  },
});
