# 🔧 Admin Access Setup Guide

## Problem
The admin panel can only see orders/products for the logged-in user, not all users, because of Supabase Row Level Security (RLS) policies.

## Solution Overview
You need to:
1. Create a Supabase authentication account for your admin
2. Add that user to the `admin_users` table
3. Log in with BOTH admin dashboard AND Supabase auth when accessing admin pages

## Step-by-Step Setup

### 1️⃣ Run the SQL Script

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy the contents of `database/enable-admin-access.sql`
4. Paste and **DO NOT RUN YET** - read step 2 first

### 2️⃣ Create Admin Supabase Account

**Option A: Sign up through your app (Recommended)**
1. Go to your app's signup page: `/signup`
2. Create an account with your admin email (e.g., `admin@mahamitra.com`)
3. Complete the signup process

**Option B: Create in Supabase Dashboard**
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **Add User**
3. Enter email and password for admin
4. Click **Create User**

### 3️⃣ Get Your Admin User ID

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Find the admin user you just created
3. Click on the user to see details
4. **Copy the User ID** (it looks like: `a1b2c3d4-5678-90ab-cdef-1234567890ab`)

### 4️⃣ Update and Run the SQL Script

1. Go back to the SQL Editor with `enable-admin-access.sql`
2. Find this section (around line 32):
   ```sql
   -- INSERT INTO admin_users (user_id, email) 
   -- VALUES ('YOUR-USER-ID-HERE', 'your-admin@email.com');
   ```
3. **Uncomment** and replace with your values:
   ```sql
   INSERT INTO admin_users (user_id, email) 
   VALUES ('a1b2c3d4-5678-90ab-cdef-1234567890ab', 'admin@mahamitra.com');
   ```
4. **Run the entire SQL script**

### 5️⃣ Login Process for Admin (IMPORTANT!)

To access admin features, you need **TWO logins**:

**Login 1: Supabase Authentication** (for database access)
- Before going to admin panel, log in at `/login` with your admin Supabase account
- This creates the auth token needed to query the database

**Login 2: Admin Dashboard** (for admin UI access)
- Go to `/admin` and use your admin dashboard credentials
- This grants access to admin pages

### 6️⃣ Verify It Works

1. Log in with your admin Supabase account at `/login`
2. Then log in to admin dashboard at `/admin`
3. Go to **Admin → Orders**
4. You should now see **ALL orders from ALL users** ✅

## Troubleshooting

### Still can't see all orders?

**Check 1: Are you logged into Supabase?**
```
Open browser console → Application → Local Storage
Look for: supabase.auth.token
If empty, you're not logged into Supabase
```

**Check 2: Is your user in admin_users table?**
```sql
-- Run in Supabase SQL Editor:
SELECT * FROM admin_users;
-- Should show your user_id and email
```

**Check 3: Check database errors**
```
Open browser console → Network tab
Refresh the orders page
Look for any 403 or 406 errors on Supabase requests
```

**Check 4: Verify policies are active**
```sql
-- Run in Supabase SQL Editor:
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'orders';
-- Should show the new admin policies
```

## Alternative Solution (Development Only)

If you just want to test quickly during development, you can temporarily allow all authenticated users to see all orders:

```sql
-- ⚠️ TEMPORARY - REMOVE IN PRODUCTION
DROP POLICY IF EXISTS "Admins and users can view orders" ON orders;
CREATE POLICY "Temp: All authenticated can view orders" ON orders
  FOR SELECT
  USING (auth.role() = 'authenticated');
```

**Remember to remove this and use the proper admin setup for production!**

## What Changed

The SQL script created:
- ✅ `admin_users` table to track admin users
- ✅ Updated RLS policies on `orders` table - admins see all, users see their own
- ✅ Admin access to product tables (insert, update, delete)
- ✅ Proper indexes for performance

## Need Help?

If you're still having issues:
1. Check the browser console for errors
2. Check the Supabase logs in your dashboard
3. Verify you're logged into BOTH accounts
4. Make sure you ran the SQL script completely
