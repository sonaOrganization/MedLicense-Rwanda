import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function seed() {
  const now = new Date().toISOString();
  const hash = (pw: string) => bcrypt.hash(pw, 12);

  const users = [
    {
      name: "Demo Student",
      email: "student@demo.com",
      password: await hash("Demo@1234"),
      role: "STUDENT",
      email_verified: now,
    },
    {
      name: "Demo Admin",
      email: "admin@demo.com",
      password: await hash("Admin@1234"),
      role: "ADMIN",
      email_verified: now,
    },
  ];

  for (const user of users) {
    const { error } = await supabase
      .from("users")
      .upsert(user, { onConflict: "email" });

    if (error) {
      console.error(`Failed to seed ${user.email}:`, error.message);
    } else {
      console.log(`✓ ${user.role}  ${user.email}`);
    }
  }

  console.log("\nSeed complete. Credentials:");
  console.log("  Student  → student@demo.com  /  Demo@1234");
  console.log("  Admin    → admin@demo.com     /  Admin@1234");
}

seed().catch(console.error);
