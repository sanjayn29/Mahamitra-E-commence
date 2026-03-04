-- ============================================================
-- MAHAMITRA E-COMMERCE — MASTER DATABASE SETUP
-- ============================================================
-- Run this ENTIRE script in your Supabase SQL Editor.
-- It is safe to re-run: uses CREATE ... IF NOT EXISTS and
-- ALTER TABLE ... ADD COLUMN IF NOT EXISTS throughout.
--
-- EXECUTION ORDER:
--   1. profiles
--   2. women_products, girls_products, babies_products
--   3. product_comments, product_ratings
--   4. cart_items, favorites
--   5. orders
--   6. RLS + Policies + Indexes
-- ============================================================


-- ==========================
-- 1. PROFILES TABLE
-- ==========================
CREATE TABLE IF NOT EXISTS profiles (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name      TEXT,
  gender    TEXT,
  email     TEXT,
  phone     TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);


-- ==========================
-- 2. PRODUCT TABLES
-- ==========================

-- Women's products
CREATE TABLE IF NOT EXISTS women_products (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "productId"  TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  material     TEXT,
  cost         INTEGER NOT NULL DEFAULT 0,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'available'
                 CHECK (status IN ('available', 'sold', 'out-of-stock')),
  sizes        TEXT[],
  colors       TEXT[],
  image        TEXT,
  size_required BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Girls' products
CREATE TABLE IF NOT EXISTS girls_products (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "productId"  TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  material     TEXT,
  cost         INTEGER NOT NULL DEFAULT 0,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'available'
                 CHECK (status IN ('available', 'sold', 'out-of-stock')),
  sizes        TEXT[],
  colors       TEXT[],
  image        TEXT,
  size_required BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Babies' products
CREATE TABLE IF NOT EXISTS babies_products (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "productId"  TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  material     TEXT,
  cost         INTEGER NOT NULL DEFAULT 0,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'available'
                 CHECK (status IN ('available', 'sold', 'out-of-stock')),
  sizes        TEXT[],
  colors       TEXT[],
  image        TEXT,
  size_required BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Products are publicly readable; only admins insert/update/delete.
-- (The admin panel bypasses RLS via service_role in the Supabase dashboard,
--  so we only need the SELECT policy for the public anon/authenticated role.)
ALTER TABLE women_products  ENABLE ROW LEVEL SECURITY;
ALTER TABLE girls_products  ENABLE ROW LEVEL SECURITY;
ALTER TABLE babies_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read women products"  ON women_products;
DROP POLICY IF EXISTS "Anyone can read girls products"  ON girls_products;
DROP POLICY IF EXISTS "Anyone can read babies products" ON babies_products;

CREATE POLICY "Anyone can read women products"
  ON women_products FOR SELECT USING (true);

CREATE POLICY "Anyone can read girls products"
  ON girls_products FOR SELECT USING (true);

CREATE POLICY "Anyone can read babies products"
  ON babies_products FOR SELECT USING (true);

-- Allow authenticated users to insert/update/delete (for admin panel using anon key)
DROP POLICY IF EXISTS "Authenticated users can manage women products"  ON women_products;
DROP POLICY IF EXISTS "Authenticated users can manage girls products"  ON girls_products;
DROP POLICY IF EXISTS "Authenticated users can manage babies products" ON babies_products;

CREATE POLICY "Authenticated users can manage women products"
  ON women_products FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage girls products"
  ON girls_products FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage babies products"
  ON babies_products FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- ==========================
-- 3. COMMENTS TABLE
-- ==========================
CREATE TABLE IF NOT EXISTS product_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id   TEXT NOT NULL,
  product_type TEXT CHECK (product_type IN ('girls','women','babies')),
  comment      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read comments"       ON product_comments;
DROP POLICY IF EXISTS "Users can manage their comments" ON product_comments;

CREATE POLICY "Anyone can read comments"
  ON product_comments FOR SELECT USING (true);

CREATE POLICY "Users can manage their comments"
  ON product_comments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ==========================
-- 4. RATINGS TABLE
-- ==========================
CREATE TABLE IF NOT EXISTS product_ratings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id   TEXT NOT NULL,
  product_type TEXT CHECK (product_type IN ('girls','women','babies')),
  rating       INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id, product_type)
);

ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read ratings"       ON product_ratings;
DROP POLICY IF EXISTS "Users can manage their ratings" ON product_ratings;

CREATE POLICY "Anyone can read ratings"
  ON product_ratings FOR SELECT USING (true);

CREATE POLICY "Users can manage their ratings"
  ON product_ratings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ==========================
-- 5. CART ITEMS TABLE
-- ==========================
CREATE TABLE IF NOT EXISTS cart_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id   TEXT NOT NULL,
  product_type TEXT CHECK (product_type IN ('girls','women','babies')),
  quantity     INTEGER DEFAULT 1 CHECK (quantity > 0),
  size         TEXT,
  color        TEXT,
  added_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id, product_type, size, color)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their cart" ON cart_items;

CREATE POLICY "Users manage their cart"
  ON cart_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ==========================
-- 6. FAVORITES TABLE
-- ==========================
CREATE TABLE IF NOT EXISTS favorites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id   TEXT NOT NULL,
  product_type TEXT CHECK (product_type IN ('girls','women','babies')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id, product_type)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their favorites" ON favorites;

CREATE POLICY "Users manage their favorites"
  ON favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ==========================
-- 7. ORDERS TABLE
-- ==========================
CREATE TABLE IF NOT EXISTS orders (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id       TEXT NOT NULL,
  product_name     TEXT NOT NULL,
  product_image    TEXT,
  selected_size    TEXT,
  selected_color   TEXT,
  quantity         INTEGER NOT NULL DEFAULT 1,
  price            DECIMAL(10,2) NOT NULL,
  total_amount     DECIMAL(10,2) NOT NULL,
  customer_name    TEXT NOT NULL,
  customer_email   TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  city             TEXT NOT NULL,
  pincode          TEXT NOT NULL,
  payment_id       TEXT UNIQUE,
  payment_status   TEXT DEFAULT 'pending'
                     CHECK (payment_status IN ('pending','completed','failed','refunded')),
  order_status     TEXT DEFAULT 'pending'
                     CHECK (order_status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own orders"   ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id);

-- Updated_at trigger for orders
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_orders_updated_at ON orders;
CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();


-- ==========================
-- 8. INDEXES
-- ==========================
CREATE INDEX IF NOT EXISTS idx_women_products_productId  ON women_products  ("productId");
CREATE INDEX IF NOT EXISTS idx_girls_products_productId  ON girls_products  ("productId");
CREATE INDEX IF NOT EXISTS idx_babies_products_productId ON babies_products ("productId");

CREATE INDEX IF NOT EXISTS idx_product_comments_product  ON product_comments(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_product_comments_user     ON product_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_product_ratings_product   ON product_ratings(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_product_ratings_user      ON product_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user           ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user            ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product         ON favorites(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_orders_user_id            ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id         ON orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at         ON orders(created_at DESC);


-- ==========================
-- 9. SCHEMA CACHE REFRESH
-- ==========================
NOTIFY pgrst, 'reload schema';

-- ============================================================
--  DONE. All tables created with RLS and indexes.
-- ============================================================
