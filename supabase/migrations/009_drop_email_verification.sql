-- Email verification is no longer required to sign in. Every account created
-- before this change was inserted with email_verified = NULL, which made
-- authorize() reject the login as "Invalid email or password". Backfill them.
UPDATE users SET email_verified = now() WHERE email_verified IS NULL;

-- Drop the now-unused verification tokens. Password-reset tokens live in the
-- same table under a `password-reset:` identifier and must be kept.
DELETE FROM verification_tokens WHERE identifier LIKE 'email-verification:%';
