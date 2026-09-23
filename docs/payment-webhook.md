# MedLicense payment webhook

AfriPay posts payment results to **SonaMovie**, which owns the AfriPay
integration. SonaMovie forwards any payment whose `client_token` starts with
`ML_` to MedLicense, and MedLicense grants the subscription.

```
user pays ──> AfriPay ──> SonaMovie ──> MedLicense webhook ──> subscription active
                                         (this document)
```

The browser is redirected separately to `/subscription?paid=true`, which polls
until the webhook has landed. Nothing about activation depends on the browser.

## Endpoint

```
POST https://<medlicense-domain>/api/payments/webhook
```

`/api/payments/afripay-callback` is an alias of the same handler, kept for
existing configuration. Use `/api/payments/webhook` for anything new.

## Authentication

Both sides share one secret, set as `PAYMENT_WEBHOOK_SECRET` on MedLicense.
Send it either way — pick whichever is easier in SonaMovie:

**Shared secret header** (simplest):

```http
x-webhook-secret: <PAYMENT_WEBHOOK_SECRET>
```

`Authorization: Bearer <secret>` is accepted as an equivalent.

**HMAC signature** (stronger; body is tamper-evident):

```http
x-afripay-signature: sha256=<hex HMAC-SHA256 of the raw request body>
```

Computed with the same secret over the exact bytes sent. If a signature header
is present it **must** be valid — it never falls back to the header check.

> The legacy `AFRIPAY_WEBHOOK_SECRET` name is still read, so existing
> deployments keep working without an env change.

## Request body

JSON or form-encoded. Keys are accepted in snake_case or camelCase, so
AfriPay's payload can be relayed without reshaping.

```json
{
  "client_token": "ML_<paymentId>",
  "status": "success",
  "transaction_id": "AFP-123456"
}
```

| Field | Required | Notes |
|---|---|---|
| `client_token` | yes | Exactly as issued at checkout. Only `ML_`-prefixed tokens are MedLicense payments. |
| `status` | yes | Activates on `success`, `completed`, `paid`, `successful`, `1`, `true` (case-insensitive). Anything else is recorded, not activated. |
| `transaction_id` | no | Stored against the payment for reconciliation. |

## Responses

| Status | Meaning | Should SonaMovie retry? |
|---|---|---|
| `200` | Authenticated and processed. Read `activated` for the outcome. | No |
| `400` | `client_token` missing. | No |
| `401` | Bad or missing credentials. `reason` says which. | No — fix the secret |
| `503` | `PAYMENT_WEBHOOK_SECRET` not set on MedLicense. | Yes, after it is configured |
| `500` | Database error; the payment is genuinely unresolved. | Yes, with backoff |

A 200 with `activated: false` is a decision, not a failure:

```json
{ "received": true, "activated": false, "reason": "already_activated" }
```

Reasons: `not_a_medlicense_payment`, `status_not_paid:<status>`,
`payment_not_found`, `already_activated`.

On success:

```json
{
  "received": true,
  "activated": true,
  "userId": "…",
  "plan": "monthly",
  "endDate": "2026-10-23T09:00:00.000Z"
}
```

## Idempotency

Safe to retry. Activation claims the payment with a conditional update
(`status = 'pending'` → `'completed'`); a concurrent or repeated call updates
zero rows and returns `already_activated` without granting a second
subscription.

If a user pays again while still subscribed, the new plan is **added to their
remaining days** rather than replacing them.

## Plans

| Plan id | Price | Access |
|---|---|---|
| `weekly` | 1,500 RWF | 7 days |
| `monthly` | 3,000 RWF | 30 days |

Plan and price come from the stored payment row, never from the webhook body —
the callback cannot change what was bought. Legacy `pro` records resolve to 30
days. Source of truth: `src/lib/plans.ts`.

## Health check

```
GET /api/payments/webhook
→ { "ok": true, "endpoint": "MedLicense payment webhook", "configured": true }
```

`configured: false` means the secret is missing and every callback will be
rejected with 503. The secret itself is never returned.

## Setup checklist

1. Generate a secret: `openssl rand -hex 32`
2. Set `PAYMENT_WEBHOOK_SECRET` in the MedLicense Vercel project (all environments)
3. Store the same value in SonaMovie
4. Point SonaMovie's `ML_` forwarding at `https://<medlicense-domain>/api/payments/webhook`
5. Confirm `GET /api/payments/webhook` reports `configured: true`

## Manual fallback

If a callback is missed, an admin can activate a pending payment from the admin
payments page, which applies the same plan duration as the webhook.
