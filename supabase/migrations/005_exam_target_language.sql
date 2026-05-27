-- Add target language audience to exams
-- NULL = all students, 'EN' = English only, 'FR' = French only
ALTER TABLE exams ADD COLUMN IF NOT EXISTS target_language TEXT
  CHECK (target_language IN ('EN', 'FR'));
