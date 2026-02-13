-- ============================================
-- SIMPLE FIX: View All Orders (Admin Access)
-- ============================================
-- This allows any authenticated user to view ALL orders
-- Use this for admin accounts
-- ============================================

-- First, fix the admin_users policy (if you haven't already)
DROP POLICY IF EXISTS "Only admins can view admin list" ON admin_users CASCADE;
DROP POLICY IF EXISTS "Authenticated users can view admin list" ON admin_users CASCADE;

-- Drop existing order policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders CASCADE;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders CASCADE;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders CASCADE;
DROP POLICY IF EXISTS "Admins and users can view orders" ON orders CASCADE;
DROP POLICY IF EXISTS "Admins and users can update orders" ON orders CASCADE;
DROP POLICY IF EXISTS "Users can insert orders" ON orders CASCADE;

-- ============================================
-- NEW SIMPLE POLICIES FOR ADMIN ACCESS
-- ============================================

-- Allow ALL authenticated users to view ALL orders
-- (Since only admins will log into the /admin panel anyway)
CREATE POLICY "Authenticated users can view all orders" ON orders
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow ALL authenticated users to update ALL orders
CREATE POLICY "Authenticated users can update all orders" ON orders
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Users can insert their own orders
CREATE POLICY "Users can insert orders" ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PRODUCT TABLES: Keep existing read policies, add admin write access
-- ============================================

-- Drop old admin-only policies
DROP POLICY IF EXISTS "Admins can manage women products" ON women_products CASCADE;
DROP POLICY IF EXISTS "Admins can manage girls products" ON girls_products CASCADE;
DROP POLICY IF EXISTS "Admins can manage babies products" ON babies_products CASCADE;

-- Allow authenticated users (admins) to manage products
CREATE POLICY "Authenticated users can manage women products" ON women_products
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage girls products" ON girls_products
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage babies products" ON babies_products
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON women_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON girls_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON babies_products TO authenticated;

-- Refresh schema
NOTIFY pgrst, 'reload schema';

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this, check:

-- 1. View all orders:
-- SELECT id, customer_name, customer_email, product_name, total_amount, order_status, created_at 
-- FROM orders 
-- ORDER BY created_at DESC;

-- 2. Count total orders:
-- SELECT COUNT(*) as total_orders FROM orders;

-- 3. Check policies:
-- SELECT tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE tablename IN ('orders', 'women_products', 'girls_products', 'babies_products')
-- ORDER BY tablename, policyname;

-- ============================================
-- NOTES
-- ============================================
-- ✅ This gives authenticated users full access to orders and products
-- ✅ Simpler than the admin_users table approach
-- ✅ Works immediately without additional setup
-- ⚠️ Make sure only admins can log into your /admin panel
-- ⚠️ The /admin panel is already protected by AdminContext
