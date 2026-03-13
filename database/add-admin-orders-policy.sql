  -- Solution for Admin Orders Access
  -- ============================================
  -- Since the admin uses session-based auth (not Supabase auth),
  -- we need to create a workaround for admin to view all orders.

  -- OPTION 1 (Recommended): Create Admin User in Supabase
  -- --------------------------------------------------------
  -- 1. Create an admin account in Supabase Auth (sign up via the app)
  -- 2. Get the admin user's ID
  -- 3. Run this policy to grant admin access:

  -- First, create a table to track admin users (Run this once)
  CREATE TABLE IF NOT EXISTS admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Insert your admin user ID (replace with your actual admin user ID from Supabase Auth)
  -- INSERT INTO admin_users (user_id) VALUES ('your-admin-user-id-here');

  -- Policy: Admin users can view all orders
  DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
  CREATE POLICY "Admins can view all orders"
    ON orders
    FOR SELECT
    USING (
      auth.uid() IN (SELECT user_id FROM admin_users)
      OR auth.uid() = user_id  -- Users can still see their own orders
    );

  -- Policy: Admin users can update all orders
  DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
  CREATE POLICY "Admins can update all orders"
    ON orders
    FOR UPDATE
    USING (
      auth.uid() IN (SELECT user_id FROM admin_users)
      OR auth.uid() = user_id
    );

  -- OPTION 2 (Temporary - FOR DEVELOPMENT ONLY):
  -- --------------------------------------------------------
  -- Temporarily allow all authenticated users to view all orders
  -- IMPORTANT: Remove this in production!

  -- DROP POLICY IF EXISTS "Temp: All authenticated users can view orders" ON orders;
  -- CREATE POLICY "Temp: All authenticated users can view orders"
  --   ON orders
  --   FOR SELECT
  --   USING (auth.role() = 'authenticated');

  -- OPTION 3 (Most Secure - Recommended for Production):
  -- --------------------------------------------------------
  -- Use user metadata to identify admins
  -- After creating your admin account, update user metadata:
  -- UPDATE auth.users 
  -- SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
  -- WHERE email = 'your-admin-email@example.com';

  -- Then use this policy:
  -- DROP POLICY IF EXISTS "Metadata-based admin access" ON orders;
  -- CREATE POLICY "Metadata-based admin access"
  --   ON orders
  --   FOR SELECT
  --   USING (
  --     (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  --     OR auth.uid() = user_id
  --   );

