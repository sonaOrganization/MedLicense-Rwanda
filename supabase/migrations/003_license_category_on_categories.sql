-- Add license_category column to categories so each category can be scoped
-- to a specific license type (NULL = shared / appears for all)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS license_category TEXT;
