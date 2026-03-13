-- ============================================================
-- Finance management support
-- ============================================================

-- Optional future wallet support on profiles.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- Event ledger for future wallet and manual finance adjustments.
-- Core analytics in the app are still calculated from existing tables.
CREATE TABLE IF NOT EXISTS finance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('ORDER_PAYMENT', 'REFUND', 'WALLET_CREDIT', 'WALLET_DEBIT')),
  reference_id TEXT,
  amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE finance_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own finance events" ON finance_events;
CREATE POLICY "Users can view own finance events"
  ON finance_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all finance events" ON finance_events;
CREATE POLICY "Admins can view all finance events"
  ON finance_events FOR SELECT
  USING (COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false));

DROP POLICY IF EXISTS "Admins can manage finance events" ON finance_events;
CREATE POLICY "Admins can manage finance events"
  ON finance_events FOR ALL
  USING (COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false))
  WITH CHECK (COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false));

CREATE INDEX IF NOT EXISTS idx_finance_events_user_created_at ON finance_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_finance_events_type_created_at ON finance_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_finance_events_reference_id ON finance_events(reference_id);

NOTIFY pgrst, 'reload schema';