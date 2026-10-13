-- Apply after 011. Adds the admin-only 200 RWF "test" plan (1 day of access) to payment activation.
BEGIN;

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
  v_days := CASE v_payment.plan WHEN 'weekly' THEN 7 WHEN 'monthly' THEN 30 WHEN 'pro' THEN 30 WHEN 'test' THEN 1 ELSE NULL END;
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

COMMIT;
