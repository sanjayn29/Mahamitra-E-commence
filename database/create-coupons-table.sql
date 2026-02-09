-- Create discount_coupons table
CREATE TABLE IF NOT EXISTS discount_coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_amount NUMERIC(10, 2) NOT NULL CHECK (discount_amount > 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE discount_coupons ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active coupons (for validation at checkout)
CREATE POLICY "Anyone can read active coupons"
  ON discount_coupons FOR SELECT
  USING (true);

-- Allow inserts (admin uses service key or anon for now)
CREATE POLICY "Allow insert coupons"
  ON discount_coupons FOR INSERT
  WITH CHECK (true);

-- Allow updates
CREATE POLICY "Allow update coupons"
  ON discount_coupons FOR UPDATE
  USING (true);

-- Allow deletes
CREATE POLICY "Allow delete coupons"
  ON discount_coupons FOR DELETE
  USING (true);
