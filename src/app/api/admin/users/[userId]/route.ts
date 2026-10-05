import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const parsed = z.object({
    action: z.enum(["ban", "unban", "make_admin", "make_student", "grant_subscription", "revoke_subscription"]),
    plan: z.enum(["weekly", "monthly", "pro"]).optional(), months: z.number().int().min(1).max(24).optional(),
    end_date: z.iso.datetime().optional(),
  }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid account action" }, { status: 400 });
  const body = parsed.data;
  const { action } = body;
  if (userId === session.user.id && ["ban", "make_student"].includes(action)) return NextResponse.json({ error: "You cannot suspend or demote yourself" }, { status: 400 });
  const { data: target, error: targetError } = await supabase.from("users").select("id").eq("id", userId).maybeSingle();
  if (targetError) return NextResponse.json({ error: "Could not load user" }, { status: 500 });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  switch (action) {
    case "ban": {
      const { error } = await supabase.from("users").update({ is_banned: true }).eq("id", userId);
      if (error) return NextResponse.json({ error: "Could not update user" }, { status: 500 });
      break;
    }
    case "unban": {
      const { error } = await supabase.from("users").update({ is_banned: false }).eq("id", userId);
      if (error) return NextResponse.json({ error: "Could not update user" }, { status: 500 });
      break;
    }
    case "make_admin": {
      const { error } = await supabase.from("users").update({ role: "ADMIN" }).eq("id", userId);
      if (error) return NextResponse.json({ error: "Could not update user" }, { status: 500 });
      break;
    }
    case "make_student": {
      const { error } = await supabase.from("users").update({ role: "STUDENT" }).eq("id", userId);
      if (error) return NextResponse.json({ error: "Could not update user" }, { status: 500 });
      break;
    }
    case "grant_subscription": {
      const { plan, months, end_date } = body as { plan?: string; months?: number; end_date?: string };
      let endDate: Date;
      if (end_date) {
        endDate = new Date(end_date);
      } else {
        endDate = new Date();
        endDate.setMonth(endDate.getMonth() + (months ?? 1));
      }
      const { error } = await supabase.from("subscriptions").upsert(
        {
          user_id:    userId,
          status:     "ACTIVE",
          plan:       plan ?? "monthly",
          start_date: new Date().toISOString(),
          end_date:   endDate.toISOString(),
          auto_renew: false,
        },
        { onConflict: "user_id" }
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }
    case "revoke_subscription": {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "CANCELLED", end_date: new Date().toISOString() })
        .eq("user_id", userId);
      if (error) return NextResponse.json({ error: "Could not revoke subscription" }, { status: 500 });
      break;
    }
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/users/[userId] — permanently remove an account.
// Rows in attempts, results, subscriptions, payments, sessions and the rest
// cascade; feedback is detached (see migration 010) so the message survives.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;

  if (userId === session.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  const { data: target } = await supabase
    .from("users")
    .select("id, email, role")
    .eq("id", userId)
    .maybeSingle();

  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Demoting first is a reversible step; deleting an admin outright is not.
  if (target.role === "ADMIN") {
    return NextResponse.json(
      { error: "Demote this admin to student before deleting the account" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("users").delete().eq("id", userId);
  if (error) {
    console.error("[ADMIN_DELETE_USER]", error);
    return NextResponse.json({ error: "Could not delete this user" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: target.email });
}
