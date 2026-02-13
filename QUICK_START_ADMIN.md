# 🎯 Quick Start: Admin View All Orders

## The Issue
Admin can only see their own orders, not orders from all users.

## The Fix - 3 Steps

### Step 1: Run the SQL Script ⚡

1. Open **Supabase Dashboard** → **SQL Editor**
2. Create a new query and paste the contents of `database/enable-admin-access.sql`
3. **Find and edit this line** (around line 32):
   ```sql
   -- INSERT INTO admin_users (user_id, email) 
   -- VALUES ('YOUR-USER-ID-HERE', 'your-admin@email.com');
   ```

### Step 2: Get Your Admin User ID 🔑

**If you already have a Supabase account:**
- Go to **Supabase Dashboard** → **Authentication** → **Users**
- Find your user and copy the **User ID**
- Skip to Step 3

**If you DON'T have a Supabase account yet:**
1. Go to your website: `/signup`
2. Sign up with email: `admin@mahamitra.com` (or your email)
3. Complete signup
4. Go to **Supabase Dashboard** → **Authentication** → **Users**
5. Find your new user and copy the **User ID**

### Step 3: Update and Run SQL 🚀

1. Go back to SQL Editor with the `enable-admin-access.sql` script
2. **Uncomment and update the INSERT line**:
   ```sql
   INSERT INTO admin_users (user_id, email) 
   VALUES ('paste-your-user-id-here', 'admin@mahamitra.com');
   ```
3. **Run the entire script** ▶️

## How to Use (Important!)

You need **TWO logins** to view all orders:

### Login Flow:
1. **First**: Go to `/login` → Log in with your Supabase account (admin@mahamitra.com)
2. **Then**: Go to `/admin` → Log in with admin dashboard credentials (sanjayn / N.Sanjay@2005)
3. **Now**: Go to `/admin/orders` → You'll see ALL orders! ✅

### Why Two Logins?
- **Supabase login** = Database access (allows viewing all orders)
- **Admin dashboard login** = UI access (allows viewing admin pages)

Both are required!

## Quick Test

After setup, to verify it works:
1. Make sure you're logged in at `/login` (check top-right for your email)
2. Go to `/admin/dashboard`
3. Click **Orders**
4. You should see orders from all users!

## Troubleshooting

**Not seeing orders?**
- Check if you're logged in (look for email in top-right corner)
- Try logging out and back in at `/login`
- Make sure you ran the SQL script completely
- Check browser console for errors

**Still stuck?**
- Open browser console (F12)
- Go to Network tab
- Refresh orders page
- Look for errors on Supabase API calls
- Check the response - if 403/401, it's an auth issue

## What Changed

### Code Changes:
- ✅ Updated [Orders.tsx](src/pages/admin/Orders.tsx) to show auth warnings
- ✅ Added better error handling
- ✅ Shows login prompt if not authenticated

### Database Changes:
- ✅ Created `admin_users` table to track admins
- ✅ Updated RLS policies on `orders` table
- ✅ Admins can now SELECT all orders
- ✅ Admins can UPDATE any order status
- ✅ Regular users still only see their own orders

## Resources

- 📄 Full setup guide: [ADMIN_ACCESS_SETUP.md](ADMIN_ACCESS_SETUP.md)
- 📄 SQL script: [database/enable-admin-access.sql](database/enable-admin-access.sql)
