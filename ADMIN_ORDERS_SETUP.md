# Admin Orders Setup Guide

## Current Implementation

✅ **Created:**
- Admin Orders page with full order management
- View all orders with product, customer, and payment details
- Update order status (pending → confirmed → processing → shipped → delivered)
- Filter orders by status
- Detailed order view dialog
- Responsive table layout

## Setup Instructions

Since your admin system uses session-based authentication (not Supabase Auth), you need to set up database access for the admin to view all orders.

### Option 1: Create Admin User in Supabase (Recommended)

1. **Create an admin account:**
   - Go to your app and sign up with an admin email (e.g., `admin@mahamitra.com`)
   - Or do it directly in Supabase Dashboard → Authentication → Users → Add User

2. **Get the admin user ID:**
   - Go to Supabase Dashboard → Authentication → Users
   - Find your admin user and copy the User ID (UUID)

3. **Run the SQL in Supabase:**
   - Go to Supabase Dashboard → SQL Editor
   - Copy the contents of `database/add-admin-orders-policy.sql`
   - Replace `'your-admin-user-id-here'` with your actual admin user ID
   - Run the SQL

4. **Log in as admin:**
   - Before accessing `/admin/orders`, first log in to your app with the admin Supabase account
   - This will create a Supabase session
   - Then navigate to `/admin/dashboard` and access Orders

### Option 2: Quick Development Setup (For Testing Only)

For quick testing, you can temporarily allow viewing all orders:

1. Go to Supabase Dashboard → SQL Editor
2. Run this query:

```sql
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Temp: Authenticated users view all orders"
  ON orders
  FOR SELECT
  USING (auth.role() = 'authenticated');
```

⚠️ **Warning:** This allows ANY authenticated user to view all orders. Remove this in production!

### Option 3: Update Existing User to Admin

If you have an existing Supabase account you want to use as admin:

1. Get your user ID from Supabase Dashboard → Authentication → Users

2. Run this SQL:

```sql
-- Add admin tracking table
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add your user as admin (replace with your user ID)
INSERT INTO admin_users (user_id) 
VALUES ('your-user-id-here');

-- Update policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Admins and users can view orders"
  ON orders
  FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
CREATE POLICY "Admins and users can update orders"
  ON orders
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
    OR auth.uid() = user_id
  );
```

## Features

### Admin Orders Page (`/admin/orders`)

**Viewing Orders:**
- Table view with all order information
- Product images and details
- Customer information
- Payment and order status
- Order date and amount

**Filtering:**
- Filter by order status (All, Pending, Confirmed, Processing, Shipped, Delivered, Cancelled)

**Order Management:**
- Update order status via dropdown
- View detailed order information in dialog
- Real-time updates with refresh button

**Order Details Dialog:**
- Complete product information
- Full customer contact details
- Delivery address
- Payment ID and status
- Order timeline (created/updated dates)

## Order Status Flow

```
Pending → Confirmed → Processing → Shipped → Delivered
                                            ↓
                                       Cancelled
```

## Testing

Once you've set up the database access:

1. Make a test purchase on your website
2. Complete the payment via Razorpay (use test mode)
3. Log in as admin (with Supabase account)
4. Go to `/admin/dashboard`
5. Click on "Orders"
6. You should see the order you just created
7. Try updating the order status
8. View order details by clicking the eye icon

## Important Notes

- Orders are automatically saved after successful Razorpay payment
- Payment status is set to "completed" on successful payment
- Order status starts as "pending" and can be updated by admin
- All orders are linked to the user who made the purchase
- Customer receives email about order (if email service is configured)

## Next Steps

After orders are working, you may want to:

1. Add email notifications when order status changes
2. Add order search functionality
3. Add bulk order actions
4. Add order analytics and reports
5. Add invoice generation
6. Add customer order tracking page
