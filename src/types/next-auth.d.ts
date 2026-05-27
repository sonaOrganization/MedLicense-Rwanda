import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      licenseCategory?: string | null;
      language?: string | null;
    } & DefaultSession["user"];
  }
}
