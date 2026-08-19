-- The application uses only the server-side service role. Block direct access
-- through Supabase's public anon/authenticated API and enforce key invariants.
CREATE TABLE IF NOT EXISTS user_sessions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_type TEXT NOT NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, device_type)
);

DELETE FROM exam_attempts older
USING exam_attempts newer
WHERE older.user_id = newer.user_id AND older.exam_id = newer.exam_id
  AND older.status = 'IN_PROGRESS' AND newer.status = 'IN_PROGRESS'
  AND (older.started_at, older.id) < (newer.started_at, newer.id);
DELETE FROM attempt_answers older
USING attempt_answers newer
WHERE older.attempt_id = newer.attempt_id AND older.question_id = newer.question_id
  AND older.id < newer.id;
DELETE FROM practical_attempts older
USING practical_attempts newer
WHERE older.user_id = newer.user_id AND older.practical_exam_id = newer.practical_exam_id
  AND older.status = 'IN_PROGRESS' AND newer.status = 'IN_PROGRESS'
  AND (older.started_at, older.id) < (newer.started_at, newer.id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_attempts_one_in_progress
  ON exam_attempts (user_id, exam_id) WHERE status = 'IN_PROGRESS';
CREATE UNIQUE INDEX IF NOT EXISTS idx_attempt_answers_attempt_question
  ON attempt_answers (attempt_id, question_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_practical_attempts_one_in_progress
  ON practical_attempts (user_id, practical_exam_id) WHERE status = 'IN_PROGRESS';

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users','accounts','verification_tokens','categories','questions','answers','exams',
    'exam_questions','exam_attempts','attempt_answers','saved_questions','subscriptions',
    'payments','videos','announcements','notifications','feedback','daily_streaks','badges',
    'user_badges','user_sessions','practical_exams','practical_groups','practical_subquestions',
    'practical_attempts','practical_attempt_answers'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', table_name);
  END LOOP;
END $$;
