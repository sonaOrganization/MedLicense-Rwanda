-- Add license_category column to users table
-- Run this migration in Supabase SQL editor or CLI

ALTER TABLE users ADD COLUMN IF NOT EXISTS license_category TEXT;

-- Optional: add a comment for documentation
COMMENT ON COLUMN users.license_category IS 'The medical license category the user is preparing for (e.g. medical_doctor, nurse_a0, pharmacist)';
