# MedLicense

MedLicense is a bilingual English/French preparation platform for Rwanda medical licensing examinations. It includes theory mock exams, self-assessed practical cases, progress analytics, tutorial videos, subscriptions, notifications, and an administration console.

## Technology

- Next.js 16 and React 19
- NextAuth credential sessions
- Supabase/PostgreSQL
- AfriPay subscriptions
- Mux video and Resend email

## Local setup

1. Copy `.env.example` to `.env.local` and replace every placeholder.
2. Apply `supabase/schema.sql`, followed by the SQL files in `supabase/migrations` in numeric order.
3. Install dependencies with `npm install`.
4. Start the application with `npm run dev`.

On Windows systems that block PowerShell scripts, use `npm.cmd run dev`.

## Required configuration

`SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`, payment secrets, Mux secrets, and Resend credentials are server-only. Never expose them through `NEXT_PUBLIC_*` variables or API responses.

Payment callbacks must send `x-afripay-signature`, containing a SHA-256 HMAC of the exact raw request body using `AFRIPAY_WEBHOOK_SECRET`. Configure this in AfriPay or in a trusted server-side relay. Unsigned callbacks are rejected.

The application no longer sends `AFRIPAY_SECRET_KEY` to browsers. If the provider requires that secret inside a browser-submitted checkout form, replace that flow with AfriPay's server-to-server checkout API.

## Automation

The daily Vercel job at `/api/cron/daily` expires outdated subscriptions, creates subscription-expiry and study reminders, sends email, and records in-app notifications. Set a strong `CRON_SECRET`; Vercel sends it as a bearer token automatically.

Set `AUTOMATION_WEBHOOK_URL` to a Zapier, Make, n8n, or custom endpoint to receive scheduled events and immediate theory/practical completion events. Requests include `x-medlicense-signature`, a SHA-256 HMAC generated with `AUTOMATION_WEBHOOK_SECRET`. The receiver must verify the exact raw request body before processing it.

Automation deliveries are deduplicated in PostgreSQL. Apply `008_automation.sql` after the security migration.

## Verification

```powershell
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run build
```

## Security notes

- Apply migrations `007_security_and_integrity.sql` and `008_automation.sql` before deployment. They harden data access and add automation delivery tracking.
- Rotate any Supabase or AfriPay key that was previously stored in a shared example file or returned to a browser.
- The application accesses Supabase through its server-side service-role client; client code must use application API routes rather than direct table access.
