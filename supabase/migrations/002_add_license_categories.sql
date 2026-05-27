-- Add license_categories array to questions (which license types this question applies to)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS license_categories TEXT[] DEFAULT '{}';

-- Add license_category to exams (which student type this exam is prepared for)
ALTER TABLE exams ADD COLUMN IF NOT EXISTS license_category TEXT;

-- Index for fast filtering of questions by license category
CREATE INDEX IF NOT EXISTS idx_questions_license_categories ON questions USING GIN (license_categories);

-- Index for fast filtering of exams by license category
CREATE INDEX IF NOT EXISTS idx_exams_license_category ON exams (license_category);
