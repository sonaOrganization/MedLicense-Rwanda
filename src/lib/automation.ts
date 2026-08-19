import { createHmac } from "node:crypto";
import { supabase } from "@/lib/supabase";

export type AutomationEvent = {
  type: string;
  userId?: string;
  occurredAt?: string;
  data?: Record<string, unknown>;
};

export async function emitAutomationEvent(event: AutomationEvent) {
  const url = process.env.AUTOMATION_WEBHOOK_URL;
  const secret = process.env.AUTOMATION_WEBHOOK_SECRET;
  if (!url || !secret) return { delivered: false, reason: "not_configured" };

  const payload = JSON.stringify({ ...event, occurredAt: event.occurredAt ?? new Date().toISOString() });
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-medlicense-signature": `sha256=${signature}` },
    body: payload,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Automation webhook returned ${response.status}`);
  return { delivered: true };
}

export async function claimAutomation(userId: string, eventType: string, dedupeKey: string) {
  const { error } = await supabase.from("automation_deliveries").insert({
    user_id: userId,
    event_type: eventType,
    dedupe_key: dedupeKey,
  });
  return !error;
}
