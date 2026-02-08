-- Database Schema for E-commerce Features
-- Run this in your Supabase SQL Editor

-- 1. Comments Table
CREATE TABLE IF NOT EXISTS product_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_type TEXT CHECK (product_type IN ('girls','women','babies')),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ratings Table (One user can rate a product only once)
CREATE TABLE IF NOT EXISTS product_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_type TEXT CHECK (product_type IN ('girls','women','babies')),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id, product_type)
);

-- 3. Cart Items Table 
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_type TEXT CHECK (product_type IN ('girls','women','babies')),
  quantity INTEGER DEFAULT 1,
  size TEXT,
  color TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id, product_type, size, color)
);

-- 4. Favorites/Wishlist Table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_type TEXT CHECK (product_type IN ('girls','women','babies')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id, product_type)
);

-- Enable Row Level Security (RLS)
ALTER TABLE product_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Comments
CREATE POLICY "Anyone can read comments" 
  ON product_comments FOR SELECT 
  USING (true);

CREATE POLICY "Users can manage their comments" 
  ON product_comments FOR ALL 
  USING (auth.uid() = user_id);

-- RLS Policies for Ratings
CREATE POLICY "Anyone can read ratings" 
  ON product_ratings FOR SELECT 
  USING (true);

CREATE POLICY "Users can manage their ratings" 
  ON product_ratings FOR ALL 
  USING (auth.uid() = user_id);

-- RLS Policies for Cart Items
CREATE POLICY "Users manage their cart" 
  ON cart_items FOR ALL 
  USING (auth.uid() = user_id);

-- RLS Policies for Favorites
CREATE POLICY "Users manage their favorites" 
  ON favorites FOR ALL 
  USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_comments_product ON product_comments(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_product_comments_user ON product_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_product_ratings_product ON product_ratings(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_product_ratings_user ON product_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product ON favorites(product_id, product_type);