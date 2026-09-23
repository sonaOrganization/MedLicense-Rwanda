// Backwards-compatible alias for the canonical webhook. Kept so anything
// already pointed at this path keeps working — new integrations should use
// /api/payments/webhook. Both share one implementation.
export { GET, POST } from "../webhook/route";
