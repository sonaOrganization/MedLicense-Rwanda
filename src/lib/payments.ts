import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Shared secret between MedLicense and the SonaMovie server that owns the
 * AfriPay integration. PAYMENT_WEBHOOK_SECRET is the current name;
 * AFRIPAY_WEBHOOK_SECRET is still read so existing deployments keep working.
 */
export function webhookSecret(): string | null {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET ?? process.env.AFRIPAY_WEBHOOK_SECRET;
  return secret && secret.trim().length > 0 ? secret : null;
}

/** Constant-time compare of two arbitrary-length strings. */
function secretsMatch(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function verifyPaymentSignature(rawBody: string, signature: string | null): boolean {
  const secret = webhookSecret();
  if (!secret || !signature) return false;
  const supplied = signature.replace(/^sha256=/i, "").trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(supplied)) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqual(Buffer.from(supplied, "hex"), Buffer.from(expected, "hex"));
}

export type WebhookAuth =
  | { ok: true; method: "signature" | "shared-secret" }
  | { ok: false; reason: "not_configured" | "missing_credentials" | "invalid_credentials" };

/**
 * Authenticates a caller of the payment webhook. Two ways in, both using the
 * same secret, so SonaMovie can pick whichever is easier to send:
 *
 *   1. `x-webhook-secret: <secret>` (or `authorization: Bearer <secret>`)
 *   2. `x-afripay-signature: sha256=<hmac of the raw body>`
 *
 * A signature header, once present, must be valid — it is never allowed to
 * fall through to the weaker check.
 */
export function verifyWebhookAuth(headers: Headers, rawBody: string): WebhookAuth {
  const secret = webhookSecret();
  if (!secret) return { ok: false, reason: "not_configured" };

  const signature = headers.get("x-afripay-signature") ?? headers.get("x-webhook-signature");
  if (signature) {
    return verifyPaymentSignature(rawBody, signature)
      ? { ok: true, method: "signature" }
      : { ok: false, reason: "invalid_credentials" };
  }

  const bearer   = headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const supplied = headers.get("x-webhook-secret")?.trim() || bearer;
  if (!supplied) return { ok: false, reason: "missing_credentials" };

  return secretsMatch(supplied, secret)
    ? { ok: true, method: "shared-secret" }
    : { ok: false, reason: "invalid_credentials" };
}

export interface PaymentPayload {
  clientToken: string;
  status: string;
  transactionId: string | null;
}

function pick(source: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
}

/**
 * Accepts JSON or form-encoded bodies, and both snake_case and camelCase keys,
 * so the forwarding server can relay AfriPay's payload without reshaping it.
 */
export function parsePaymentPayload(rawBody: string, contentType: string): PaymentPayload {
  let source: Record<string, unknown>;

  if (contentType.includes("application/json")) {
    try {
      const parsed = JSON.parse(rawBody);
      source = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      source = {};
    }
  } else {
    source = Object.fromEntries(new URLSearchParams(rawBody));
  }

  return {
    clientToken:   pick(source, "client_token", "clientToken", "token", "reference") ?? "",
    status:        pick(source, "status", "payment_status", "paymentStatus", "state") ?? "",
    transactionId: pick(source, "transaction_id", "transactionId", "txn_id", "txnId"),
  };
}
