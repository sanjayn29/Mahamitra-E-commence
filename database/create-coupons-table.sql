-- Create the discount_coupons table
CREATE TABLE IF NOT EXISTS discount_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL CHECK (discount_amount > 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE discount_coupons ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read coupons (to validate during checkout)
CREATE POLICY "Anyone can read coupons"
  ON discount_coupons FOR SELECT
  USING (true);

-- Policy: Only authenticated users (admins) can manage coupons
CREATE POLICY "Authenticated users can manage coupons"
  ON discount_coupons FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_discount_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_discount_coupons_updated_at
  BEFORE UPDATE ON discount_coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_discount_coupons_updated_at();

-- Notify Supabase to refresh schema cache
NOTIFY pgrst, 'reload schema';
