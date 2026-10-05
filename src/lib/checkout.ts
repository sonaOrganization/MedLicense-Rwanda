export function validCheckoutUrl(value: unknown, relayUrl: string): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    const hosts = new Set(["www.afripay.africa", "afripay.africa", new URL(relayUrl).hostname,
      ...(process.env.PAYMENT_CHECKOUT_ALLOWED_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean)]);
    return url.protocol === "https:" && !url.username && !url.password && hosts.has(url.hostname) ? url.href : null;
  } catch { return null; }
}
