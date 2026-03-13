-- ============================================================
-- Product variants, reviews, and address management migration
-- ============================================================

-- 1) Shared product catalog for cross-table relations
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_public_id TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('women', 'girls', 'babies')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read product catalog" ON products;
CREATE POLICY "Anyone can read product catalog"
  ON products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage product catalog" ON products;
CREATE POLICY "Admins can manage product catalog"
  ON products FOR ALL
  USING (COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false))
  WITH CHECK (COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false));

INSERT INTO products (product_public_id, category)
SELECT "productId", 'women' FROM women_products
ON CONFLICT (product_public_id) DO UPDATE SET category = EXCLUDED.category;

INSERT INTO products (product_public_id, category)
SELECT "productId", 'girls' FROM girls_products
ON CONFLICT (product_public_id) DO UPDATE SET category = EXCLUDED.category;

INSERT INTO products (product_public_id, category)
SELECT "productId", 'babies' FROM babies_products
ON CONFLICT (product_public_id) DO UPDATE SET category = EXCLUDED.category;

-- 2) Product variants
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_public_id TEXT NOT NULL,
  product_category TEXT NOT NULL CHECK (product_category IN ('women', 'girls', 'babies')),
  color TEXT NOT NULL,
  size TEXT NOT NULL DEFAULT 'Free Size',
  image_url TEXT NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  price_override NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, color, size),
  UNIQUE (product_public_id, product_category, color, size)
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read product variants" ON product_variants;
CREATE POLICY "Public can read product variants"
  ON product_variants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage product variants" ON product_variants;
CREATE POLICY "Admins can manage product variants"
  ON product_variants FOR ALL
  USING (COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false))
  WITH CHECK (COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false));

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_lookup ON product_variants(product_public_id, product_category);
CREATE INDEX IF NOT EXISTS idx_product_variants_option_lookup ON product_variants(product_public_id, product_category, color, size);

-- Example queries:
-- SELECT * FROM product_variants WHERE product_public_id = 'MMWOM0001' AND product_category = 'women';
-- SELECT * FROM product_variants WHERE product_public_id = 'MMWOM0001' AND product_category = 'women' AND color = 'Red' AND size = 'M' AND stock_quantity > 0;


-- 3) Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_public_id TEXT NOT NULL,
  product_category TEXT NOT NULL CHECK (product_category IN ('women', 'girls', 'babies')),
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, user_id),
  CONSTRAINT fk_reviews_auth_users FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_profiles FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_reviews_auth_users'
  ) THEN
    ALTER TABLE reviews
      ADD CONSTRAINT fk_reviews_auth_users
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'fk_reviews_profiles'
     ) THEN
    ALTER TABLE reviews
      ADD CONSTRAINT fk_reviews_profiles
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END
$$;

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
CREATE POLICY "Authenticated users can insert reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;
CREATE POLICY "Users can delete their own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_public_id, product_category);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- 4) Addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own addresses" ON addresses;
CREATE POLICY "Users can insert their own addresses"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own addresses" ON addresses;
CREATE POLICY "Users can read their own addresses"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own addresses" ON addresses;
CREATE POLICY "Users can update their own addresses"
  ON addresses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own addresses" ON addresses;
CREATE POLICY "Users can delete their own addresses"
  ON addresses FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_default ON addresses(user_id, is_default);

-- Keep only one default address per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_addresses_single_default
  ON addresses(user_id)
  WHERE is_default = true;

-- 5) Cart + order updates for variant/address references
ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON cart_items(variant_id);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES addresses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_variant_id ON orders(variant_id);
CREATE INDEX IF NOT EXISTS idx_orders_address_id ON orders(address_id);

-- allow multi-item checkout rows using the same payment id
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_id_key;
CREATE INDEX IF NOT EXISTS idx_orders_payment_id_non_unique ON orders(payment_id);

NOTIFY pgrst, 'reload schema';
