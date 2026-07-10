-- Practical Session feature: case-based oral review exams
-- Structure: practical_exams -> practical_groups ("Question 1/2/3") -> practical_subquestions ("1A/1B")
-- Attempts are self-graded (no objective answer key) via practical_attempts / practical_attempt_answers.

-- practical_exams (analogous to exams)
CREATE TABLE IF NOT EXISTS practical_exams (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_fr TEXT,
  description TEXT,
  description_fr TEXT,
  category_id TEXT REFERENCES categories(id),
  license_category TEXT,
  target_language TEXT CHECK (target_language IN ('EN', 'FR')),
  is_free BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  total_groups INT NOT NULL DEFAULT 0,
  total_subquestions INT NOT NULL DEFAULT 0,
  created_by_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_practical_exams_license_category ON practical_exams (license_category);

-- practical_groups ("Question 1", "Question 2"... the clinical case/stem unit)
CREATE TABLE IF NOT EXISTS practical_groups (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  practical_exam_id TEXT NOT NULL REFERENCES practical_exams(id) ON DELETE CASCADE,
  stem_en TEXT NOT NULL,
  stem_fr TEXT,
  image_url TEXT,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_practical_groups_exam ON practical_groups (practical_exam_id);

-- practical_subquestions ("1A", "1B"... the prompt + model-answer flashcard unit)
CREATE TABLE IF NOT EXISTS practical_subquestions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  group_id TEXT NOT NULL REFERENCES practical_groups(id) ON DELETE CASCADE,
  prompt_en TEXT NOT NULL,
  prompt_fr TEXT,
  model_answer_en TEXT NOT NULL,
  model_answer_fr TEXT,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_practical_subquestions_group ON practical_subquestions (group_id);

-- practical_attempts (analogous to exam_attempts; reuses the existing exam_status enum)
CREATE TABLE IF NOT EXISTS practical_attempts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  practical_exam_id TEXT NOT NULL REFERENCES practical_exams(id) ON DELETE CASCADE,
  status exam_status NOT NULL DEFAULT 'IN_PROGRESS',
  total_subquestions INT NOT NULL DEFAULT 0,
  reviewed_count INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  incorrect_count INT NOT NULL DEFAULT 0,
  score FLOAT,
  time_taken INT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  saved_state JSONB
);

CREATE INDEX IF NOT EXISTS idx_practical_attempts_user ON practical_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_practical_attempts_exam ON practical_attempts (practical_exam_id);
CREATE INDEX IF NOT EXISTS idx_practical_attempts_in_progress
  ON practical_attempts (user_id, practical_exam_id) WHERE status = 'IN_PROGRESS';

-- practical_attempt_answers (self-graded, analogous to attempt_answers)
CREATE TABLE IF NOT EXISTS practical_attempt_answers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  attempt_id TEXT NOT NULL REFERENCES practical_attempts(id) ON DELETE CASCADE,
  subquestion_id TEXT NOT NULL REFERENCES practical_subquestions(id),
  is_correct BOOLEAN NOT NULL,
  time_taken INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, subquestion_id)
);
