import { createHash } from "node:crypto";
import { supabase } from "@/lib/supabase";
export async function consumeLimit(scope: string, identity: string, limit: number, seconds: number): Promise<boolean> {
  const key = scope + ":" + createHash("sha256").update(identity).digest("hex");
  const { data, error } = await supabase.rpc("consume_request_limit", { p_key: key, p_limit: limit, p_seconds: seconds });
  if (error) { console.error("[REQUEST_LIMIT]", error); return false; }
  return data === true;
}
