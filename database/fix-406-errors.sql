-- Critical database fixes for 406 and 400 errors

-- First, add missing columns to cart_items
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS size VARCHAR(20),
ADD COLUMN IF NOT EXISTS color VARCHAR(50);

-- Drop and recreate RLS policies to fix 406 errors
-- These policies were too restrictive and causing access issues

-- CART_ITEMS policies
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart_items;
DROP POLICY IF EXISTS "users_can_view_own_cart" ON cart_items;
DROP POLICY IF EXISTS "users_can_insert_own_cart" ON cart_items;
DROP POLICY IF EXISTS "users_can_update_own_cart" ON cart_items;
DROP POLICY IF EXISTS "users_can_delete_own_cart" ON cart_items;

CREATE POLICY "Enable all cart operations for users" ON cart_items
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- FAVORITES policies
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON favorites;
DROP POLICY IF EXISTS "Users can remove favorites" ON favorites;
DROP POLICY IF EXISTS "users_can_view_own_favorites" ON favorites;
DROP POLICY IF EXISTS "users_can_insert_own_favorites" ON favorites;
DROP POLICY IF EXISTS "users_can_delete_own_favorites" ON favorites;

CREATE POLICY "Enable all favorites operations for users" ON favorites
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- PRODUCT_COMMENTS policies
DROP POLICY IF EXISTS "Users can view all comments" ON product_comments;
DROP POLICY IF EXISTS "Users can add comments" ON product_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON product_comments;
DROP POLICY IF EXISTS "users_can_view_comments" ON product_comments;
DROP POLICY IF EXISTS "users_can_insert_comments" ON product_comments;
DROP POLICY IF EXISTS "users_can_delete_own_comments" ON product_comments;

CREATE POLICY "Enable comments viewing for all users" ON product_comments
    FOR SELECT USING (true);
    
CREATE POLICY "Enable comments insert for authenticated users" ON product_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
    
CREATE POLICY "Enable comments delete for own comments" ON product_comments
    FOR DELETE USING (auth.uid() = user_id);

-- PRODUCT_RATINGS policies  
DROP POLICY IF EXISTS "Users can view all ratings" ON product_ratings;
DROP POLICY IF EXISTS "Users can add their own ratings" ON product_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON product_ratings;
DROP POLICY IF EXISTS "users_can_view_ratings" ON product_ratings;
DROP POLICY IF EXISTS "users_can_insert_ratings" ON product_ratings;
DROP POLICY IF EXISTS "users_can_update_own_ratings" ON product_ratings;

CREATE POLICY "Enable ratings viewing for all users" ON product_ratings
    FOR SELECT USING (true);
    
CREATE POLICY "Enable ratings operations for authenticated users" ON product_ratings
    FOR ALL 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- PRODUCT TABLES - Make them accessible to authenticated users
-- Women Products
DROP POLICY IF EXISTS "Enable read access for all users" ON women_products;
CREATE POLICY "Enable women products read access" ON women_products
    FOR SELECT USING (true);

-- Girls Products
DROP POLICY IF EXISTS "Enable read access for all users" ON girls_products;
CREATE POLICY "Enable girls products read access" ON girls_products
    FOR SELECT USING (true);

-- Babies Products
DROP POLICY IF EXISTS "Enable read access for all users" ON babies_products;
CREATE POLICY "Enable babies products read access" ON babies_products
    FOR SELECT USING (true);

-- Grant permissions to ensure access
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_items TO authenticated;
GRANT SELECT, INSERT, DELETE ON favorites TO authenticated;
GRANT SELECT, INSERT, DELETE ON product_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_ratings TO authenticated;
GRANT SELECT ON women_products TO public, authenticated;
GRANT SELECT ON girls_products TO public, authenticated;
GRANT SELECT ON babies_products TO public, authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Create helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_cart_items_composite ON cart_items(user_id, product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_favorites_composite ON favorites(user_id, product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_comments_product ON product_comments(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_ratings_product ON product_ratings(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_ratings_user_product ON product_ratings(user_id, product_id, product_type);