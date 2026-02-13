-- ============================================
-- ADMIN ACCESS SETUP FOR MAHAMITRA ECOMMERCE
-- ============================================
-- This script grants admin users full access to:
-- - View all orders from all users
-- - Update order status
-- - Full access to product tables (insert, update, delete)
-- ============================================

-- Step 1: Create admin_users table to track who is an admin
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view admin list (needed to check admin status)
-- This table only contains user_ids and emails, no sensitive data
CREATE POLICY "Authenticated users can view admin list" ON admin_users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- ============================================
-- Step 2: INSERT YOUR ADMIN USER ID HERE
-- ============================================
-- INSTRUCTIONS:
-- 1. Sign up with your admin email at your app (e.g., admin@mahamitra.com)
-- 2. Go to Supabase Dashboard → Authentication → Users
-- 3. Copy your User ID (UUID)
-- 4. Uncomment and run the INSERT statement below, replacing the values:

-- INSERT INTO admin_users (user_id, email) 
-- VALUES ('YOUR-USER-ID-HERE', 'your-admin@email.com');

-- Example:
-- INSERT INTO admin_users (user_id, email) 
-- VALUES ('a1b2c3d4-5678-90ab-cdef-1234567890ab', 'admin@mahamitra.com');

-- ============================================
-- Step 3: Update ORDERS table policies for admin access
-- ============================================

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;

-- New policy: Admins can SELECT all orders, users can SELECT their own
CREATE POLICY "Admins and users can view orders" ON orders
  FOR SELECT
  USING (
    -- Admin can see all orders
    auth.uid() IN (SELECT user_id FROM admin_users)
    OR 
    -- Users can see their own orders
    auth.uid() = user_id
  );

-- New policy: Admins can UPDATE all orders, users can UPDATE their own
CREATE POLICY "Admins and users can update orders" ON orders
  FOR UPDATE
  USING (
    -- Admin can update all orders
    auth.uid() IN (SELECT user_id FROM admin_users)
    OR 
    -- Users can update their own orders
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admin_users)
    OR 
    auth.uid() = user_id
  );

-- New policy: Users can INSERT their own orders
CREATE POLICY "Users can insert orders" ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Step 4: Grant admin access to PRODUCT tables
-- ============================================

-- Women Products - Admin can insert, update, delete
DROP POLICY IF EXISTS "Admins can manage women products" ON women_products;
CREATE POLICY "Admins can manage women products" ON women_products
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM admin_users))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));

-- Girls Products - Admin can insert, update, delete
DROP POLICY IF EXISTS "Admins can manage girls products" ON girls_products;
CREATE POLICY "Admins can manage girls products" ON girls_products
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM admin_users))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));

-- Babies Products - Admin can insert, update, delete
DROP POLICY IF EXISTS "Admins can manage babies products" ON babies_products;
CREATE POLICY "Admins can manage babies products" ON babies_products
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM admin_users))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));

-- ============================================
-- Step 5: Grant necessary permissions
-- ============================================

GRANT SELECT ON admin_users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON women_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON girls_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON babies_products TO authenticated;

-- ============================================
-- Step 6: Refresh schema
-- ============================================

NOTIFY pgrst, 'reload schema';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- After setup, run these to verify:

-- 1. Check if your user is in admin_users table:
-- SELECT * FROM admin_users;

-- 2. Test if you can see all orders:
-- SELECT COUNT(*) FROM orders;

-- 3. Check existing policies:
-- SELECT tablename, policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('orders', 'women_products', 'girls_products', 'babies_products', 'admin_users');

-- ============================================
-- NOTES
-- ============================================
-- 1. You MUST be logged in with your admin Supabase account to see all orders
-- 2. The admin session-based login is separate - you need BOTH logins:
--    a) Regular Supabase login (creates auth token)
--    b) Admin dashboard login (for UI access)
-- 3. In your admin page, make sure you're logged into Supabase first
-- 4. If you still can't see orders, check your browser's Network tab for 403 errors
