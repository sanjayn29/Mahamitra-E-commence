-- ============================================================
-- Coupon system upgrade: flat + percentage + min order + cap
-- ============================================================

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('flat', 'percentage')),
  discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
  min_order_value NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (min_order_value >= 0),
  max_discount NUMERIC(12, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT coupons_percentage_limit CHECK (
    discount_type <> 'percentage'
    OR discount_value <= 100
  ),
  CONSTRAINT coupons_max_discount_positive CHECK (
    max_discount IS NULL OR max_discount > 0
  )
);

CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_created_at ON coupons(created_at DESC);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active coupons" ON coupons;
CREATE POLICY "Anyone can read active coupons"
  ON coupons FOR SELECT
  USING (
    is_active = TRUE
    AND (expires_at IS NULL OR expires_at >= NOW())
  );

DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  USING (COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::BOOLEAN, FALSE))
  WITH CHECK (COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::BOOLEAN, FALSE));

CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_coupons_updated_at ON coupons;
CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_coupons_updated_at();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'discount_coupons'
  ) THEN
    INSERT INTO coupons (
      code,
      discount_type,
      discount_value,
      min_order_value,
      max_discount,
      is_active,
      created_at,
      updated_at
    )
    SELECT
      UPPER(dc.code),
      'flat',
      dc.discount_amount,
      0,
      NULL,
      dc.is_active,
      dc.created_at,
      COALESCE(dc.updated_at, dc.created_at)
    FROM discount_coupons dc
    ON CONFLICT (code) DO NOTHING;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';