-- Add French description column to exams table
ALTER TABLE exams ADD COLUMN IF NOT EXISTS description_fr TEXT;
