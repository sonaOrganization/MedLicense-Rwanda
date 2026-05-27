-- ─────────────────────────────────────────────────────────────────────────────
-- Create demo Medical Doctor account — run once in the Supabase SQL editor
-- Login: doctor@demo.com / demo1234
-- ─────────────────────────────────────────────────────────────────────────────

-- Insert demo doctor (idempotent — skips if email already exists)
INSERT INTO users (name, email, password, role, license_category, email_verified, created_at, updated_at)
SELECT
  'Demo Doctor',
  'doctor@demo.com',
  '$2b$12$.5a8CFEG873.LaGDYnmZjeSjtLOMQHbIoqwJBAMZN.ZxpDjGVx1fe',
  'STUDENT',
  'medical_doctor',
  now(),
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'doctor@demo.com'
);

-- Confirm
SELECT id, name, email, role, license_category, email_verified IS NOT NULL AS verified
FROM users
WHERE email = 'doctor@demo.com';
