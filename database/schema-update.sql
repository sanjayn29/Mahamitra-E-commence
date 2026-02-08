-- Add missing columns to cart_items table
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS size VARCHAR(20),
ADD COLUMN IF NOT EXISTS color VARCHAR(50);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_product ON cart_items(user_id, product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_favorites_user_product ON favorites(user_id, product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_product_ratings_product ON product_ratings(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_product_comments_product ON product_comments(product_id, product_type);

-- Update RLS policies to be more permissive for testing
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart_items;

CREATE POLICY "Users can manage their cart items" ON cart_items
  FOR ALL USING (auth.uid() = user_id);

-- Similar for other tables
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON favorites;
DROP POLICY IF EXISTS "Users can remove favorites" ON favorites;

CREATE POLICY "Users can manage their favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- Make sure all tables have proper permissions
GRANT ALL ON cart_items TO anon, authenticated;
GRANT ALL ON favorites TO anon, authenticated;
GRANT ALL ON product_ratings TO anon, authenticated;
GRANT ALL ON product_comments TO anon, authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';