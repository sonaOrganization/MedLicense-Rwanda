# Secure payment flow

MedLicense creates an order with its server-owned plan and price. SonaMovie creates a hosted checkout. Only a verified SonaMovie webhook can mark the order paid and extend access. The browser return URL and polling endpoint never grant access.

## Deploy the database change first

Apply `supabase/migrations/011_secure_workflows.sql` after migrations 001–010. It adds transactional payment activation, serialized renewals, server-owned exam deadlines, immutable attempt snapshots, atomic grading and admin editing, reset-token consumption, and distributed request limits. RPC execution is restricted to the Supabase service role.

New installations use `supabase/schema.sql`, then all numbered migrations in order. This sequence is exercised by the PostgreSQL regression test. Do not apply the base schema again to an existing database.

Deploy the updated application after the migration. Existing sessions missing a stored session ID must sign in again.

## Configuration

### Direct AfriPay mode (default)

- `AFRIPAY_APP_ID` / `AFRIPAY_APP_SECRET` (legacy `AFRIPAY_PUBLIC_KEY` / `AFRIPAY_SECRET_KEY` also read): from AfriPay's integration email.
- `PAYMENT_WEBHOOK_SECRET` (or legacy `AFRIPAY_WEBHOOK_SECRET`): random secret, at least 32 bytes.
- `NEXT_PUBLIC_APP_URL`: the MedLicense HTTPS origin.

Payment initiation returns AfriPay's form fields and the browser POSTs them to `https://www.afripay.africa/checkout/index.php`. AfriPay's form carries `app_id` and `app_secret` in the page by design; that does not let anyone mark an order paid.

Give AfriPay this callback URL:

```
https://<medlicense-domain>/api/payments/webhook?key=<PAYMENT_WEBHOOK_SECRET>
```

AfriPay POSTs `status`, `amount`, `currency`, `transaction_ref`, `payment_method`, `client_token`. It cannot sign callbacks, so the `key` query parameter authenticates it; the activation RPC still rejects any amount/currency that differs from the order. Treat the callback URL as a secret.

### Relay mode (used when `PAYMENT_CHECKOUT_URL` and `PAYMENT_CHECKOUT_SECRET` are both set)

- `PAYMENT_CHECKOUT_URL`: the exact HTTPS SonaMovie server endpoint that creates a hosted checkout.
- `PAYMENT_CHECKOUT_SECRET`: a separate secret used only for the checkout API.
- `PAYMENT_WEBHOOK_SECRET`: a separate secret shared with SonaMovie for confirmed-payment forwarding.
- `NEXT_PUBLIC_APP_URL`: the MedLicense HTTPS origin in production.
- `PAYMENT_CHECKOUT_ALLOWED_HOSTS`: comma-separated additional checkout hostnames, if needed. AfriPay and the configured relay hostname are allowed by default.

The legacy `AFRIPAY_WEBHOOK_SECRET` is accepted when `PAYMENT_WEBHOOK_SECRET` is unset. Never reuse the AfriPay checkout credential as the webhook secret.

AfriPay's form URL does **not** implement the SonaMovie checkout contract below; use it only through direct mode.

## SonaMovie checkout contract

MedLicense sends:

```http
POST <PAYMENT_CHECKOUT_URL>
Authorization: Bearer <PAYMENT_CHECKOUT_SECRET>
Content-Type: application/json
Idempotency-Key: <payment UUID>
```

```json
{
  "amount": 3000,
  "currency": "RWF",
  "comment": "MedLicense Monthly Plan (30 days)",
  "client_token": "ML_<payment UUID>",
  "plan": "monthly",
  "return_url": "https://<medlicense-domain>/subscription?payment=<payment UUID>",
  "webhook_url": "https://<medlicense-domain>/api/payments/webhook"
}
```

The relay must authenticate the server request, create a checkout using its provider integration, and preserve the exact client token. Return:

```json
{ "checkout_url": "https://<approved-checkout-host>/<hosted-session>" }
```

A camelCase `checkoutUrl` response is also accepted. Responses containing raw provider HTML or provider credentials are not accepted. Secrets must not be embedded in checkout URL query parameters.

## Confirmed-payment webhook

After SonaMovie verifies payment with AfriPay, forward the actual settled amount, currency, and unique provider transaction ID:

```http
POST https://<medlicense-domain>/api/payments/webhook
Content-Type: application/json
x-afripay-signature: sha256=<HMAC-SHA256 of the exact raw JSON body>
```

```json
{
  "client_token": "ML_<payment UUID>",
  "status": "success",
  "transaction_id": "AFP-123456",
  "amount": 3000,
  "currency": "RWF"
}
```

Sign using `PAYMENT_WEBHOOK_SECRET`. Shared-secret headers (`x-webhook-secret` or `Authorization: Bearer`) remain supported, but an included signature must be valid and cannot fall back to a shared-secret header.

Use the actual provider settlement fields. Never copy amount/currency from an untrusted browser or merely from the originally requested checkout fields. A paid status without transaction ID, amount, and currency is rejected.

### Relaying AfriPay callbacks from another site

When AfriPay's callbackUrl points to another site, copy `integrations/sonamovie/medlicense-forward.php` there and add this at the top of its AfriPay callback handler:

```php
require_once __DIR__ . '/medlicense-forward.php';
relayMedLicenseAfriPayCallback(); // exits for ML_ payments, returns otherwise
```

Set `MEDLICENSE_WEBHOOK_URL` (`https://<medlicense-domain>/api/payments/webhook`) and `MEDLICENSE_WEBHOOK_SECRET` (equal to MedLicense's `PAYMENT_WEBHOOK_SECRET`) on that site. Callbacks whose `client_token` starts with `ML_` are signed and forwarded immediately, with `transaction_ref` sent as `transaction_id`. Everything else falls through to the site's own logic. AfriPay callbacks are unsigned. Set `AFRIPAY_CALLBACK_KEY` and register the callback URL with `?key=<value>` so nobody can relay a fake success.

## Responses and retries

| HTTP status | Meaning |
| --- | --- |
| 200 | Activated, already activated, or a non-paid/unrelated event. |
| 400 | Invalid payload or missing settlement details. |
| 401 | Missing or invalid authentication. |
| 404 | Unknown MedLicense payment. Investigate and retry after reconciliation. |
| 409 | Amount/currency mismatch, conflicting transaction, or non-payable order state. Investigate. |
| 500 | Database transaction failed. Retry with backoff; no partial activation is committed. |
| 503 | Webhook secret is not configured. Retry after configuration. |

A replay of the same paid event returns `already_activated`. Different paid orders for one account serialize their subscription extensions so neither overwrites purchased time. Each transaction ID can belong to only one payment.

Pending payment records are retained for late confirmations and reconciliation. The daily job no longer deletes them.

## Browser and admin behavior

The return page polls `GET /api/payments/activate?paymentId=<UUID>`, scoped to the signed-in account. It displays approval only after that particular order is marked completed. An existing subscription does not count as confirmation of a new payment.

Manual payment activation is disabled. `POST /api/admin/payments/activate` returns 410 for administrators. Subscription grants remain a separate admin account-management action.

## Video configuration

Premium video uploads use Mux signed playback. Configure `MUX_WEBHOOK_SECRET`, `MUX_SIGNING_KEY_ID`, and `MUX_SIGNING_PRIVATE_KEY`. An absent webhook secret rejects all events.

For legacy premium assets with public playback, unpublish and republish through the admin video controls after configuring signing keys. Publishing a premium video creates/reuses signed playback, revokes existing public playback IDs, and updates the database. Existing public playback links stop working. These provider changes occur when an administrator performs that action; this repository change does not modify live Mux assets by itself.

## Validation

```powershell
npm.cmd test
npx.cmd tsc --noEmit
npm.cmd run lint -- --max-warnings=0
npm.cmd run build
npm.cmd audit --omit=dev
```

The tests run PostgreSQL in memory and never connect to the live Supabase database. They cover migration execution, rollback, renewal stacking, ownership, replay handling, grading, deadlines, snapshots, reset-token reuse, session revocation, validation, and webhook authentication.

The development-only braces dependency has no upstream fixed release for GHSA-vfj7-8cjw-p6xm. `scripts/harden-braces.mjs` applies bounded nesting checks at install time and regression tests verify the guard. npm audit still reports the upstream package version and its development dependents. This mitigation is not an upstream version fix.