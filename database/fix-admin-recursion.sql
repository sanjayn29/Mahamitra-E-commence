-- ============================================
-- QUICK FIX: Admin Users Infinite Recursion
-- ============================================
-- Run this IMMEDIATELY in Supabase SQL Editor to fix the error
-- ============================================

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Only admins can view admin list" ON admin_users;

-- Create a non-recursive policy that allows authenticated users to view the list
-- This is safe because the table only contains user_ids and emails (no sensitive data)
CREATE POLICY "Authenticated users can view admin list" ON admin_users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Refresh schema
NOTIFY pgrst, 'reload schema';

-- ============================================
-- After running this, refresh your admin orders page
-- ============================================
