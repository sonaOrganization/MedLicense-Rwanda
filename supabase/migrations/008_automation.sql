CREATE TABLE IF NOT EXISTS automation_deliveries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  dedupe_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_type, dedupe_key)
);
ALTER TABLE automation_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE automation_deliveries FROM anon, authenticated;
CREATE INDEX IF NOT EXISTS idx_automation_deliveries_created_at ON automation_deliveries(created_at);
