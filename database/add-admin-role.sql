-- ==========================================
-- ADMIN ROLE SETUP AND RLS POLICIES
-- ==========================================

-- 1. Helper Function: Make a User Admin
-- Replace 'USER_EMAIL_HERE' with your actual Supabase email before running this portion,
-- or just run the UPDATE command directly if you know the UUID.
-- DO NOT RUN THIS IN PRODUCTION WITHOUT VERIFYING THE EMAIL!

-- Example:
-- UPDATE auth.users
-- SET raw_user_meta_data = 
--   COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
-- WHERE email = 'YOUR_ADMIN_EMAIL@example.com';


-- 2. Update ORDERS Table Policies

-- First, drop the generic SELECT policy if it exists (assuming it was named exactly this)
-- It's safer to drop and recreate the necessary policies.
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;

-- Recreate policy: Normal users can only see their own orders
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- New policy: Admins can SELECT all orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- New policy: Admins can UPDATE all orders (e.g., changing order_status)
CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- Notify Supabase to refresh schema cache
NOTIFY pgrst, 'reload schema';
