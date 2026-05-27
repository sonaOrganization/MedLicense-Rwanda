-- ─────────────────────────────────────────────────────────────────────────────
-- Reset demo accounts — run this in the Supabase SQL editor
-- Resets practice data for all three demo accounts:
--   student@demo.com  → dentist
--   doctor@demo.com   → medical_doctor
--   admin@demo.com    → (admin, unchanged)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Set license categories for demo student accounts
UPDATE users SET license_category = 'dentist',        updated_at = now() WHERE email = 'student@demo.com';
UPDATE users SET license_category = 'medical_doctor', updated_at = now() WHERE email = 'doctor@demo.com';

-- 2. Delete all exam attempts for demo accounts
DELETE FROM attempt_answers
WHERE attempt_id IN (
  SELECT id FROM exam_attempts
  WHERE user_id IN (
    SELECT id FROM users WHERE email IN ('student@demo.com', 'doctor@demo.com', 'admin@demo.com')
  )
);

DELETE FROM exam_attempts
WHERE user_id IN (
  SELECT id FROM users WHERE email IN ('student@demo.com', 'doctor@demo.com', 'admin@demo.com')
);

-- 3. Clear study streak & points
DELETE FROM daily_streaks
WHERE user_id IN (
  SELECT id FROM users WHERE email IN ('student@demo.com', 'doctor@demo.com', 'admin@demo.com')
);

-- 4. Clear badges
DELETE FROM user_badges
WHERE user_id IN (
  SELECT id FROM users WHERE email IN ('student@demo.com', 'doctor@demo.com', 'admin@demo.com')
);

-- 5. Clear saved questions
DELETE FROM saved_questions
WHERE user_id IN (
  SELECT id FROM users WHERE email IN ('student@demo.com', 'doctor@demo.com', 'admin@demo.com')
);

-- 6. Confirm
SELECT id, name, email, role, license_category
FROM users
WHERE email IN ('student@demo.com', 'doctor@demo.com', 'admin@demo.com');
