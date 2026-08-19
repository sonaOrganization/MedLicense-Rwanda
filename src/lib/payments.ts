import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyPaymentSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.AFRIPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const supplied = signature.replace(/^sha256=/i, "").trim().toLowerCase();
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (!/^[a-f0-9]{64}$/.test(supplied)) return false;
  return timingSafeEqual(Buffer.from(supplied, "hex"), Buffer.from(expected, "hex"));
}

export function parsePaymentPayload(rawBody: string, contentType: string) {
  if (contentType.includes("application/json")) {
    try {
      const body = JSON.parse(rawBody) as Record<string, unknown>;
      return {
        clientToken: typeof body.client_token === "string" ? body.client_token : "",
        status: typeof body.status === "string" ? body.status : "",
        transactionId: typeof body.transaction_id === "string" ? body.transaction_id : null,
      };
    } catch {
      return { clientToken: "", status: "", transactionId: null };
    }
  }
  const body = new URLSearchParams(rawBody);
  return {
    clientToken: body.get("client_token") ?? "",
    status: body.get("status") ?? "",
    transactionId: body.get("transaction_id"),
  };
}
