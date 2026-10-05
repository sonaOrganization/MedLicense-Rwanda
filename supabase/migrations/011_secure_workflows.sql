-- Apply after 010. All state transitions below run in one PostgreSQL transaction.
BEGIN;

ALTER TABLE questions ADD COLUMN IF NOT EXISTS language language NOT NULL DEFAULT 'EN';
ALTER TABLE questions ALTER COLUMN text_en DROP NOT NULL;
ALTER TABLE answers ALTER COLUMN text_en DROP NOT NULL;
ALTER TABLE answers ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS points_per_question INTEGER NOT NULL DEFAULT 1;
ALTER TABLE exams ALTER COLUMN category_id DROP NOT NULL;
-- Older installations may have only the student-rating feedback fields.
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general';
ALTER TABLE feedback ALTER COLUMN subject DROP NOT NULL;
ALTER TABLE feedback ALTER COLUMN message DROP NOT NULL;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS playback_policy TEXT NOT NULL DEFAULT 'public';
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS exam_snapshot JSONB;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMPTZ;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS saved_revision BIGINT NOT NULL DEFAULT 0;
ALTER TABLE practical_attempts ADD COLUMN IF NOT EXISTS exam_snapshot JSONB;
ALTER TABLE practical_attempts ADD COLUMN IF NOT EXISTS saved_revision BIGINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS request_limits (
  key TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL,
  hits INTEGER NOT NULL
);
ALTER TABLE request_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON request_limits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION consume_request_limit(p_key TEXT, p_limit INTEGER, p_seconds INTEGER)
RETURNS BOOLEAN LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_hits INTEGER;
BEGIN
  INSERT INTO request_limits AS r (key, window_started_at, hits)
  VALUES (p_key, clock_timestamp(), 1)
  ON CONFLICT (key) DO UPDATE SET
    hits = CASE WHEN r.window_started_at <= clock_timestamp() - make_interval(secs => p_seconds) THEN 1 ELSE r.hits + 1 END,
    window_started_at = CASE WHEN r.window_started_at <= clock_timestamp() - make_interval(secs => p_seconds) THEN clock_timestamp() ELSE r.window_started_at END
  RETURNING hits INTO v_hits;
  RETURN v_hits <= p_limit;
END $$;

CREATE OR REPLACE FUNCTION activate_verified_payment(p_payment_id TEXT, p_transaction_id TEXT, p_amount NUMERIC, p_currency TEXT)
RETURNS JSONB LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  v_payment payments%ROWTYPE;
  v_subscription subscriptions%ROWTYPE;
  v_now TIMESTAMPTZ := clock_timestamp();
  v_end TIMESTAMPTZ;
  v_days INTEGER;
BEGIN
  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('activated', false, 'reason', 'payment_not_found'); END IF;
  IF p_transaction_id IS NULL OR btrim(p_transaction_id) = '' OR p_amount IS NULL OR p_currency IS NULL
    OR p_amount <> v_payment.amount::numeric OR upper(p_currency) <> upper(v_payment.currency)
  THEN RETURN jsonb_build_object('activated', false, 'reason', 'payment_details_mismatch'); END IF;
  IF v_payment.status = 'completed' THEN
    IF v_payment.transaction_id IS DISTINCT FROM p_transaction_id THEN
      RETURN jsonb_build_object('activated', false, 'reason', 'transaction_mismatch');
    END IF;
    RETURN jsonb_build_object('activated', false, 'reason', 'already_activated');
  END IF;
  IF v_payment.status NOT IN ('pending', 'failed', 'stale') THEN
    RETURN jsonb_build_object('activated', false, 'reason', 'payment_not_pending');
  END IF;
  -- Serialize different payments for the same user, including the first renewal.
  PERFORM id FROM users WHERE id = v_payment.user_id FOR UPDATE;
  SELECT * INTO v_subscription FROM subscriptions WHERE user_id = v_payment.user_id FOR UPDATE;
  v_now := clock_timestamp();
  v_days := CASE v_payment.plan WHEN 'weekly' THEN 7 WHEN 'monthly' THEN 30 WHEN 'pro' THEN 30 ELSE NULL END;
  IF v_days IS NULL THEN RAISE EXCEPTION 'Unsupported payment plan'; END IF;
  v_end := CASE WHEN v_subscription.status = 'ACTIVE' AND v_subscription.end_date > v_now
    THEN v_subscription.end_date ELSE v_now END + make_interval(days => v_days);
  INSERT INTO subscriptions(user_id, status, plan, start_date, end_date, auto_renew)
  VALUES(v_payment.user_id, 'ACTIVE', v_payment.plan, v_now, v_end, false)
  ON CONFLICT(user_id) DO UPDATE SET status = 'ACTIVE', plan = EXCLUDED.plan,
    start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date, auto_renew = false, updated_at = v_now;
  UPDATE payments SET status = 'completed', transaction_id = p_transaction_id,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('activated_at', v_now)
    WHERE id = v_payment.id;
  RETURN jsonb_build_object('activated', true, 'userId', v_payment.user_id, 'plan', v_payment.plan, 'endDate', v_end);
END $$;

CREATE OR REPLACE FUNCTION theory_exam_snapshot(p_exam_id TEXT)
RETURNS JSONB LANGUAGE sql SET search_path = public, pg_temp AS $$
  SELECT to_jsonb(e) || jsonb_build_object('questions', coalesce((
    SELECT jsonb_agg(to_jsonb(q) || jsonb_build_object('answers', coalesce((
      SELECT jsonb_agg(to_jsonb(a) ORDER BY a."order", a.id)
      FROM answers a WHERE a.question_id = q.id AND a.is_active
    ), '[]'::jsonb)) ORDER BY eq."order", eq.id)
    FROM exam_questions eq JOIN questions q ON q.id = eq.question_id WHERE eq.exam_id = e.id
  ), '[]'::jsonb)) FROM exams e WHERE e.id = p_exam_id
$$;

CREATE OR REPLACE FUNCTION practical_exam_snapshot(p_exam_id TEXT)
RETURNS JSONB LANGUAGE sql SET search_path = public, pg_temp AS $$
  SELECT to_jsonb(e) || jsonb_build_object('groups', coalesce((
    SELECT jsonb_agg(to_jsonb(g) || jsonb_build_object('subquestions', coalesce((
      SELECT jsonb_agg(to_jsonb(s) ORDER BY s."order", s.id) FROM practical_subquestions s WHERE s.group_id = g.id
    ), '[]'::jsonb)) ORDER BY g."order", g.id) FROM practical_groups g WHERE g.practical_exam_id = e.id
  ), '[]'::jsonb)) FROM practical_exams e WHERE e.id = p_exam_id
$$;

-- Backfill before deploying the new app. Snapshots keep grading and review consistent.
UPDATE exam_attempts a SET exam_snapshot = theory_exam_snapshot(a.exam_id),
  deadline_at = a.started_at + make_interval(mins => e.duration_minutes)
FROM exams e WHERE e.id = a.exam_id AND a.exam_snapshot IS NULL;
UPDATE practical_attempts SET exam_snapshot = practical_exam_snapshot(practical_exam_id) WHERE exam_snapshot IS NULL;

CREATE OR REPLACE FUNCTION start_exam_attempt(p_user_id TEXT, p_exam_id TEXT, p_kind TEXT)
RETURNS JSONB LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_snapshot JSONB; v_result JSONB; v_allowed BOOLEAN; v_total INTEGER;
BEGIN
  IF p_kind NOT IN ('theory', 'practical') THEN RAISE EXCEPTION 'Invalid exam kind'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('attempt:' || p_user_id || ':' || p_kind || ':' || p_exam_id, 0));
  IF p_kind = 'theory' THEN
    PERFORM id FROM exams WHERE id = p_exam_id AND is_published FOR SHARE;
    IF NOT FOUND THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
    v_snapshot := theory_exam_snapshot(p_exam_id);
  ELSE
    PERFORM id FROM practical_exams WHERE id = p_exam_id AND is_published FOR SHARE;
    IF NOT FOUND THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
    v_snapshot := practical_exam_snapshot(p_exam_id);
  END IF;
  SELECT EXISTS(SELECT 1 FROM users WHERE id = p_user_id AND NOT is_banned) AND
    ((v_snapshot->>'is_free')::boolean OR EXISTS(
      SELECT 1 FROM subscriptions WHERE user_id = p_user_id
      AND ((status = 'ACTIVE' AND (end_date IS NULL OR end_date > clock_timestamp()))
        OR (status = 'TRIAL' AND (coalesce(trial_ends_at, end_date) IS NULL OR coalesce(trial_ends_at, end_date) > clock_timestamp())))
    )) INTO v_allowed;
  IF NOT v_allowed THEN RETURN jsonb_build_object('error', 'access_denied'); END IF;
  IF p_kind = 'theory' THEN
    IF jsonb_array_length(v_snapshot->'questions') = 0 OR (v_snapshot->>'duration_minutes')::integer < 1 THEN
      RETURN jsonb_build_object('error', 'empty_exam');
    END IF;
    SELECT to_jsonb(a) INTO v_result FROM exam_attempts a
      WHERE user_id = p_user_id AND exam_id = p_exam_id AND status = 'IN_PROGRESS';
    IF v_result IS NULL THEN
      INSERT INTO exam_attempts(user_id, exam_id, status, exam_snapshot, deadline_at)
      VALUES(p_user_id, p_exam_id, 'IN_PROGRESS', v_snapshot,
        clock_timestamp() + make_interval(mins => (v_snapshot->>'duration_minutes')::integer))
      RETURNING to_jsonb(exam_attempts.*) INTO v_result;
    END IF;
  ELSE
    SELECT count(*) INTO v_total FROM jsonb_array_elements(v_snapshot->'groups') g,
      LATERAL jsonb_array_elements(g->'subquestions') s;
    IF v_total = 0 THEN RETURN jsonb_build_object('error', 'empty_exam'); END IF;
    SELECT to_jsonb(a) INTO v_result FROM practical_attempts a
      WHERE user_id = p_user_id AND practical_exam_id = p_exam_id AND status = 'IN_PROGRESS';
    IF v_result IS NULL THEN
      INSERT INTO practical_attempts(user_id, practical_exam_id, total_subquestions, exam_snapshot)
      VALUES(p_user_id, p_exam_id, v_total, v_snapshot)
      RETURNING to_jsonb(practical_attempts.*) INTO v_result;
    END IF;
  END IF;
  IF p_kind = 'theory' THEN
    v_result := v_result || jsonb_build_object('remaining_seconds', greatest(0, ceil(extract(epoch FROM (v_result->>'deadline_at')::timestamptz - clock_timestamp()))));
  END IF;
  RETURN v_result;
END $$;

CREATE OR REPLACE FUNCTION save_exam_state(p_user_id TEXT, p_attempt_id TEXT, p_kind TEXT, p_state JSONB, p_revision BIGINT)
RETURNS JSONB LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_id TEXT;
BEGIN
  IF jsonb_typeof(p_state) <> 'object' OR p_revision < 0 OR p_revision > floor(extract(epoch FROM clock_timestamp()) * 1000) + 60000 THEN
    RETURN jsonb_build_object('error', 'invalid_state');
  END IF;
  IF p_kind = 'theory' THEN
    UPDATE exam_attempts SET saved_state = p_state, saved_revision = p_revision
    WHERE id = p_attempt_id AND user_id = p_user_id AND status = 'IN_PROGRESS'
      AND deadline_at > clock_timestamp() AND saved_revision <= p_revision RETURNING id INTO v_id;
  ELSIF p_kind = 'practical' THEN
    UPDATE practical_attempts SET saved_state = p_state, saved_revision = p_revision
    WHERE id = p_attempt_id AND user_id = p_user_id AND status = 'IN_PROGRESS'
      AND saved_revision <= p_revision RETURNING id INTO v_id;
  END IF;
  IF v_id IS NULL THEN RETURN jsonb_build_object('error', 'state_not_saved'); END IF;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION submit_exam_attempt(p_user_id TEXT, p_attempt_id TEXT, p_kind TEXT, p_answers JSONB)
RETURNS JSONB LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  v_theory exam_attempts%ROWTYPE; v_practical practical_attempts%ROWTYPE;
  v_snapshot JSONB; v_answers JSONB; v_question JSONB; v_sub JSONB; v_selected TEXT;
  v_correct INTEGER := 0; v_wrong INTEGER := 0; v_skipped INTEGER := 0; v_total INTEGER := 0;
  v_score DOUBLE PRECISION; v_is_correct BOOLEAN; v_timed_out BOOLEAN := false; v_seconds INTEGER; v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
  IF jsonb_typeof(p_answers) <> 'object' THEN RETURN jsonb_build_object('error', 'invalid_answers'); END IF;
  IF p_kind = 'theory' THEN
    SELECT * INTO v_theory FROM exam_attempts WHERE id = p_attempt_id AND user_id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
    IF v_theory.status <> 'IN_PROGRESS' THEN RETURN jsonb_build_object('error', 'already_submitted'); END IF;
    v_now := clock_timestamp();
    v_snapshot := v_theory.exam_snapshot;
    v_timed_out := v_theory.deadline_at <= v_now;
    -- Late requests may only grade answers saved before the server deadline.
    v_answers := CASE WHEN v_timed_out THEN coalesce(v_theory.saved_state->'answers', '{}'::jsonb) ELSE p_answers END;
    FOR v_question IN SELECT value FROM jsonb_array_elements(v_snapshot->'questions') LOOP
      v_selected := v_answers->>(v_question->>'id');
      IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(v_question->'answers') a WHERE a->>'id' = v_selected) THEN v_selected := NULL; END IF;
      SELECT coalesce(bool_or((a->>'is_correct')::boolean), false) INTO v_is_correct
        FROM jsonb_array_elements(v_question->'answers') a WHERE a->>'id' = v_selected;
      v_total := v_total + 1;
      IF v_selected IS NULL THEN v_skipped := v_skipped + 1;
      ELSIF v_is_correct THEN v_correct := v_correct + 1; ELSE v_wrong := v_wrong + 1; END IF;
      INSERT INTO attempt_answers(attempt_id, question_id, answer_id, is_correct)
        VALUES(p_attempt_id, v_question->>'id', v_selected, v_is_correct)
        ON CONFLICT(attempt_id, question_id) DO UPDATE SET answer_id = EXCLUDED.answer_id, is_correct = EXCLUDED.is_correct;
    END LOOP;
    IF v_total = 0 THEN RAISE EXCEPTION 'Exam has no questions'; END IF;
    v_score := greatest(0, (v_correct - CASE WHEN (v_snapshot->>'negative_marking')::boolean THEN v_wrong * 0.25 ELSE 0 END) * 100.0 / v_total);
    v_seconds := greatest(0, round(extract(epoch FROM least(v_now, v_theory.deadline_at) - v_theory.started_at)))::integer;
    UPDATE exam_attempts SET status = CASE WHEN v_timed_out THEN 'TIMED_OUT'::exam_status ELSE 'COMPLETED'::exam_status END,
      score = v_score, correct = v_correct, wrong = v_wrong, skipped = v_skipped, total_answered = v_correct + v_wrong,
      time_taken = v_seconds, submitted_at = v_now, saved_state = NULL WHERE id = p_attempt_id;
    RETURN jsonb_build_object('ok', true, 'score', v_score, 'correct', v_correct, 'wrong', v_wrong, 'skipped', v_skipped,
      'timedOut', v_timed_out, 'examId', v_theory.exam_id, 'attemptId', p_attempt_id);
  ELSIF p_kind = 'practical' THEN
    SELECT * INTO v_practical FROM practical_attempts WHERE id = p_attempt_id AND user_id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
    IF v_practical.status <> 'IN_PROGRESS' THEN RETURN jsonb_build_object('error', 'already_submitted'); END IF;
    v_now := clock_timestamp();
    v_snapshot := v_practical.exam_snapshot;
    FOR v_sub IN SELECT s FROM jsonb_array_elements(v_snapshot->'groups') g, LATERAL jsonb_array_elements(g->'subquestions') s LOOP
      IF p_answers ? (v_sub->>'id') THEN
        IF jsonb_typeof(p_answers->(v_sub->>'id')) <> 'boolean' THEN RAISE EXCEPTION 'Invalid practical answer'; END IF;
        v_is_correct := (p_answers->>(v_sub->>'id'))::boolean;
        IF v_is_correct THEN v_correct := v_correct + 1; ELSE v_wrong := v_wrong + 1; END IF;
        INSERT INTO practical_attempt_answers(attempt_id, subquestion_id, is_correct)
          VALUES(p_attempt_id, v_sub->>'id', v_is_correct)
          ON CONFLICT(attempt_id, subquestion_id) DO UPDATE SET is_correct = EXCLUDED.is_correct;
      END IF;
    END LOOP;
    v_total := v_correct + v_wrong;
    v_score := CASE WHEN v_total > 0 THEN v_correct * 100.0 / v_total ELSE 0 END;
    v_seconds := greatest(0, round(extract(epoch FROM v_now - v_practical.started_at)))::integer;
    UPDATE practical_attempts SET status = 'COMPLETED', reviewed_count = v_total, correct_count = v_correct,
      incorrect_count = v_wrong, score = v_score, time_taken = v_seconds, submitted_at = v_now, saved_state = NULL WHERE id = p_attempt_id;
    RETURN jsonb_build_object('ok', true, 'score', v_score, 'correct', v_correct, 'incorrect', v_wrong, 'reviewedCount', v_total,
      'practicalExamId', v_practical.practical_exam_id, 'attemptId', p_attempt_id);
  END IF;
  RETURN jsonb_build_object('error', 'invalid_kind');
END $$;

CREATE OR REPLACE FUNCTION save_question(p_id TEXT, p_question JSONB, p_answers JSONB)
RETURNS TEXT LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_id TEXT := coalesce(p_id, gen_random_uuid()::text); v_answer JSONB; v_answer_id TEXT; v_order INTEGER := 0;
BEGIN
  IF jsonb_typeof(p_answers) <> 'array' OR jsonb_array_length(p_answers) < 2 OR jsonb_array_length(p_answers) > 6
    OR (SELECT count(*) FROM jsonb_array_elements(p_answers) a WHERE a->>'is_correct' = 'true') <> 1
  THEN RAISE EXCEPTION 'Exactly one correct answer and 2 to 6 options are required'; END IF;
  IF p_id IS NOT NULL THEN
    PERFORM id FROM questions WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Question not found'; END IF;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_answers) a WHERE a->>'id' IS NOT NULL
      AND NOT EXISTS(SELECT 1 FROM answers WHERE id = a->>'id' AND question_id = p_id)) THEN
      RAISE EXCEPTION 'Answer does not belong to this question';
    END IF;
  END IF;
  IF (SELECT count(a->>'id') FROM jsonb_array_elements(p_answers) a) <>
     (SELECT count(DISTINCT a->>'id') FROM jsonb_array_elements(p_answers) a) THEN RAISE EXCEPTION 'Duplicate answer IDs'; END IF;
  INSERT INTO questions(id, text_en, text_fr, explanation_en, explanation_fr, difficulty, category_id, language, license_categories, type, is_approved, is_active)
  VALUES(v_id, nullif(p_question->>'text_en', ''), nullif(p_question->>'text_fr', ''), nullif(p_question->>'explanation_en', ''),
    nullif(p_question->>'explanation_fr', ''), (p_question->>'difficulty')::difficulty, p_question->>'category_id',
    (p_question->>'language')::language, ARRAY(SELECT jsonb_array_elements_text(p_question->'license_categories')), 'MULTIPLE_CHOICE', true, true)
  ON CONFLICT(id) DO UPDATE SET text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr, explanation_en = EXCLUDED.explanation_en,
    explanation_fr = EXCLUDED.explanation_fr, difficulty = EXCLUDED.difficulty, category_id = EXCLUDED.category_id,
    language = EXCLUDED.language, license_categories = EXCLUDED.license_categories, updated_at = clock_timestamp();
  -- Retire removed options rather than deleting answers referenced by old attempts.
  UPDATE answers SET is_active = false WHERE question_id = v_id;
  FOR v_answer IN SELECT value FROM jsonb_array_elements(p_answers) LOOP
    IF coalesce(nullif(v_answer->>'text_en', ''), nullif(v_answer->>'text_fr', '')) IS NULL THEN RAISE EXCEPTION 'Answer text required'; END IF;
    v_answer_id := coalesce(v_answer->>'id', gen_random_uuid()::text);
    INSERT INTO answers(id, question_id, text_en, text_fr, is_correct, "order", is_active)
    VALUES(v_answer_id, v_id, nullif(v_answer->>'text_en', ''), nullif(v_answer->>'text_fr', ''),
      (v_answer->>'is_correct')::boolean, v_order, true)
    ON CONFLICT(id) DO UPDATE SET text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr,
      is_correct = EXCLUDED.is_correct, "order" = EXCLUDED."order", is_active = true;
    v_order := v_order + 1;
  END LOOP;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION save_theory_exam(p_id TEXT, p_exam JSONB, p_question_ids JSONB)
RETURNS TEXT LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_id TEXT := coalesce(p_id, gen_random_uuid()::text); v_qid TEXT; v_order INTEGER := 0;
BEGIN
  IF p_id IS NOT NULL THEN
    PERFORM id FROM exams WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Exam not found'; END IF;
  END IF;
  IF jsonb_typeof(p_question_ids) <> 'array'
    OR jsonb_array_length(p_question_ids) <> (SELECT count(DISTINCT value) FROM jsonb_array_elements_text(p_question_ids))
  THEN RAISE EXCEPTION 'Invalid or duplicate questions'; END IF;
  IF (p_exam->>'is_published')::boolean AND jsonb_array_length(p_question_ids) = 0 THEN RAISE EXCEPTION 'Published exam requires questions'; END IF;
  INSERT INTO exams(id, title, title_en, description, category_id, license_category, target_language,
    duration_minutes, passing_score, points_per_question, total_questions, is_free, is_published, shuffle_questions, shuffle_answers)
  VALUES(v_id, p_exam->>'title_en', p_exam->>'title_en', nullif(p_exam->>'description', ''), nullif(p_exam->>'category_id', ''),
    nullif(p_exam->>'license_category', ''), nullif(p_exam->>'target_language', ''),
    (p_exam->>'duration_minutes')::integer, (p_exam->>'passing_score')::integer, (p_exam->>'points_per_question')::integer,
    jsonb_array_length(p_question_ids), (p_exam->>'is_free')::boolean, (p_exam->>'is_published')::boolean,
    (p_exam->>'shuffle_questions')::boolean, (p_exam->>'shuffle_answers')::boolean)
  ON CONFLICT(id) DO UPDATE SET title = EXCLUDED.title, title_en = EXCLUDED.title_en, description = EXCLUDED.description,
    category_id = EXCLUDED.category_id, license_category = EXCLUDED.license_category, target_language = EXCLUDED.target_language,
    duration_minutes = EXCLUDED.duration_minutes, passing_score = EXCLUDED.passing_score, points_per_question = EXCLUDED.points_per_question,
    total_questions = EXCLUDED.total_questions, is_free = EXCLUDED.is_free, is_published = EXCLUDED.is_published,
    shuffle_questions = EXCLUDED.shuffle_questions, shuffle_answers = EXCLUDED.shuffle_answers, updated_at = clock_timestamp();
  DELETE FROM exam_questions WHERE exam_id = v_id;
  FOR v_qid IN SELECT jsonb_array_elements_text(p_question_ids) LOOP
    INSERT INTO exam_questions(exam_id, question_id, "order") VALUES(v_id, v_qid, v_order);
    v_order := v_order + 1;
  END LOOP;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION reset_account_password(p_identifier TEXT, p_token_hash TEXT, p_password TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_user_id TEXT;
BEGIN
  PERFORM token FROM verification_tokens WHERE identifier = p_identifier AND token = p_token_hash AND expires > clock_timestamp() FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE users SET password = p_password, updated_at = clock_timestamp()
    WHERE email = substring(p_identifier FROM length('password-reset:') + 1) RETURNING id INTO v_user_id;
  IF v_user_id IS NULL THEN RETURN false; END IF;
  DELETE FROM verification_tokens WHERE identifier = p_identifier;
  DELETE FROM user_sessions WHERE user_id = v_user_id;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION fix_french_questions()
RETURNS INTEGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE questions SET language = 'FR', text_fr = coalesce(nullif(text_fr, ''), text_en), updated_at = clock_timestamp()
  WHERE text_en ~ '[éèêëàâçîïôùûüœÉÈÊËÀÂÇÎÏÔÙÛÜŒ]' AND language <> 'FR';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;

-- PostgreSQL grants EXECUTE to PUBLIC by default. These RPCs are service-only.
DO $$
DECLARE v_function regprocedure;
BEGIN
  FOR v_function IN SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN ('consume_request_limit', 'activate_verified_payment',
      'theory_exam_snapshot', 'practical_exam_snapshot', 'start_exam_attempt', 'save_exam_state', 'submit_exam_attempt',
      'save_question', 'save_theory_exam', 'reset_account_password', 'fix_french_questions')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', v_function);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', v_function);
  END LOOP;
END $$;
GRANT ALL ON request_limits TO service_role;
COMMIT;