# MedLicense

A bilingual English/French preparation platform for Rwanda medical licensing exams, with theory exams, self-assessed practical cases, analytics, video tutorials, subscriptions, notifications, and an admin console.

## Setup

1. Copy .env.example to .env.local and configure the required values.
2. For a fresh database, apply supabase/schema.sql, then migrations 001–011 in numeric order.
3. For an existing database already at migration 010, apply only supabase/migrations/011_secure_workflows.sql before deploying this app.
4. Install dependencies with npm install.
5. Start development with npm run dev (npm.cmd run dev on Windows systems that block PowerShell scripts).

Migration 011 is required for login request limits, payment transactions, server-owned exam deadlines, immutable attempt snapshots, atomic grading and content editing, password-reset token consumption, and the updated feedback schema. Regression tests execute the complete fresh-install sequence in a disposable PostgreSQL database.

## Payments

Payment activation is exclusively through an authenticated webhook. SonaMovie must confirm the actual provider settlement and forward the transaction ID, settled amount, currency, and ML_ order token.

The browser return URL does not grant access. Payment polling checks the specific order belonging to the current user. Pending orders are retained for reconciliation. Manual payment activation is disabled.

Checkout uses a configured server-to-server SonaMovie hosted-checkout endpoint. The AfriPay browser-form URL is not a compatible hosted-checkout API and its hidden app_secret is visible to visitors. MedLicense does not return provider credentials and fails safely until a compatible relay endpoint is configured.

See [the payment integration guide](docs/payment-webhook.md) for the exact checkout contract, webhook payload, retry rules, migration steps, and forwarding helper.

## Security configuration

Keep SUPABASE_SERVICE_ROLE_KEY, auth secrets, payment secrets, Mux signing credentials, and Resend credentials server-only. Never place them in NEXT_PUBLIC_* variables or API responses.

JWTs are checked against current account status and stored device sessions on every auth() call, including API access. Role changes, bans, deleted accounts, replaced sessions, and password resets invalidate or update access immediately.

Premium videos require signed Mux playback. Configure MUX_WEBHOOK_SECRET, MUX_SIGNING_KEY_ID, and MUX_SIGNING_PRIVATE_KEY. Legacy premium assets are converted to signed playback when an admin republishes them, which revokes their old public playback links.

Contact submissions are validated, rate limited, and stored in the admin feedback inbox. Auth and payment initiation also use database-backed request limits.

Rotate any credential previously shared in source files, browser responses, or chat.

## Automation

The daily Vercel job at /api/cron/daily expires subscriptions, sends reminders, and records notifications. Configure CRON_SECRET. Pending payment records are not deleted.

Optional AUTOMATION_WEBHOOK_URL and AUTOMATION_WEBHOOK_SECRET deliver signed completion and scheduled events to your automation service. Verify the raw-body HMAC before processing events.

## Verification

Run npm test, npx tsc --noEmit, npm run lint -- --max-warnings=0, npm run build, and npm audit --omit=dev. Use npm.cmd and npx.cmd on Windows if needed.

Tests never connect to the live database.

Development tooling still includes the upstream braces advisory GHSA-vfj7-8cjw-p6xm, which has no patched release. The postinstall script applies a bounded nesting guard and regression tests verify the mitigation. npm audit still identifies the upstream version; the guard does not conceal the advisory.