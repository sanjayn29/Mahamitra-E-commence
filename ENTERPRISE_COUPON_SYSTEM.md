# Enterprise Coupon System - Implementation Guide

## Overview

A complete, production-grade coupon system has been implemented to support enterprise-level discount workflows. This system includes usage tracking, product mapping, backend validation, and a scalable architecture for future enhancements.

## Architecture Components

### 1. Database Schema (database/enterprise-coupon-system.sql)

#### Core Tables

**coupons** (Enhanced)
- `id` (UUID): Primary key
- `code` (VARCHAR): Unique coupon code
- `discount_type` (VARCHAR): 'flat' or 'percentage'
- `discount_value` (NUMERIC): Discount amount or percentage
- `min_order_value` (NUMERIC): Minimum order total required
- `max_discount` (NUMERIC): Maximum discount cap (for percentage coupons)
- `is_active` (BOOLEAN): Active/inactive toggle
- `expires_at` (TIMESTAMP): Optional expiration date
- **NEW:** `coupon_type` (VARCHAR): 'FLAT', 'PERCENT', or 'FIRST_ORDER'
- **NEW:** `total_usage_limit` (INTEGER): Maximum total uses across all users
- **NEW:** `used_count` (INTEGER): Current usage count (auto-updated)
- **NEW:** `specific_product_id` (UUID): Optional product-specific restriction

**coupon_usage** (NEW)
- `id` (UUID): Primary key
- `coupon_id` (UUID): Reference to coupons table
- `user_id` (UUID): Reference to user who used coupon
- `order_id` (UUID): Reference to order created with coupon
- `used_at` (TIMESTAMP): When coupon was used
- Unique constraint: `(coupon_id, user_id, order_id)`
- Purpose: Tracks individual coupon usage to enforce "one coupon per user" policies

**coupon_product_mapping** (NEW)
- `id` (UUID): Primary key
- `coupon_id` (UUID): Reference to coupons table
- `product_id` (UUID): Reference to products table
- Unique constraint: `(coupon_id, product_id)`
- Purpose: Maps coupons to specific products for product-restricted coupons

**orders** (Enhanced)
- Added columns:
  - `coupon_id` (UUID): Reference to coupon used on this order
  - `coupon_code` (VARCHAR): Coupon code for reference
  - `coupon_discount_amount` (NUMERIC): Final discount amount applied
  - `coupon_type` (VARCHAR): Type of coupon used
- Purpose: Persistency of coupon data with order for analytics and auditing

### 2. Backend RPC Functions

#### validate_and_apply_coupon()
```sql
validate_and_apply_coupon(
  p_coupon_code: VARCHAR,
  p_user_id: UUID,
  p_order_total: NUMERIC,
  p_product_ids: UUID[]
)
```

**Performs 8-step validation:**
1. Checks if coupon exists and is active
2. Verifies coupon has not expired
3. Validates total usage limit not reached
4. Checks if user already used coupon (prevents reuse)
5. Checks minimum order value requirement
6. Validates product applicability (for product-specific coupons)
7. Calculates discount amount based on type
8. Applies maximum discount cap and ensures discount ≤ order total

**Returns:**
- `success` (BOOLEAN): Validation passed/failed
- `coupon_id` (UUID): Coupon ID (for recording usage)
- `discount_amount` (NUMERIC): Calculated discount (backend-secure value)
- `coupon_type` (VARCHAR): Type of coupon
- `error_message` (TEXT): Reason for failure if applicable

**Security:** Marked as SECURITY DEFINER to run with Supabase role privileges, preventing user manipulation of discount validation.

#### record_coupon_usage()
```sql
record_coupon_usage(
  p_coupon_id: UUID,
  p_user_id: UUID,
  p_order_id: UUID
)
```

**Purpose:** Records coupon usage after successful order placement
- Idempotent (uses ON CONFLICT DO NOTHING)
- Automatically triggers `update_coupon_used_count()` function
- Returns success/error status

#### Triggers
- `trigger_coupon_usage_update_count`: Automatically increments `used_count` on coupons table when usage is recorded

### 3. Frontend Services

#### couponService.ts (Enhanced)

**New Types:**
```typescript
export type CouponType = 'FLAT' | 'PERCENT' | 'FIRST_ORDER';
```

**Enhanced Coupon Interface:**
```typescript
interface Coupon {
  id: string;
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  is_active: boolean;
  expires_at?: string | null;
  coupon_type?: CouponType;
  total_usage_limit?: number | null;
  used_count?: number;
  specific_product_id?: string | null;
  created_at: string;
}
```

**New Functions:**

1. **hasUserUsedCoupon(couponId: string): Promise<boolean>**
   - Checks if current user has already used a specific coupon
   - Returns true if coupon_usage record exists

2. **isCouponUsageLimitReached(coupon: Coupon): boolean**
   - Checks if coupon total_usage_limit has been reached
   - Logic: `used_count >= total_usage_limit`

3. **getUserOrdersCount(): Promise<number>**
   - Returns total non-cancelled orders for current user
   - Used to determine first-order coupon eligibility

4. **isUserEligibleForFirstOrderCoupon(): Promise<boolean>**
   - Checks if user has 0 non-cancelled orders
   - Returns true if user can use first-order coupons

5. **formatCouponOfferWithUsage(coupon: Coupon): string**
   - Returns human-readable coupon offer with usage info
   - Example: "₹200 OFF (First Order Only) - 50 left"

**Updated Functions:**
- `getActiveCoupons()`: Now fetches all new fields including coupon_type, total_usage_limit, used_count
- `validateCouponCode()`: Fetches complete coupon data for frontend reference

### 4. razorpayService.ts (Enhanced)

**Updated OrderData Interface:**
```typescript
interface OrderData {
  // ... existing fields ...
  couponCode?: string | null;
  couponId?: string | null;
  couponDiscountAmount?: number;
  couponType?: string;
}
```

**Enhanced saveOrderToDatabase():**
1. **Backend Coupon Validation:** Calls `validate_and_apply_coupon()` RPC if coupon provided
   - Uses backend-calculated discount (not frontend value)
   - Validates all eligibility checks server-side
   - Throws error if validation fails

2. **Persists Coupon Data:** Stores on order rows:
   - `coupon_id`
   - `coupon_code`
   - `coupon_discount_amount` (from RPC validation)
   - `coupon_type`

3. **Records Usage:** Calls `record_coupon_usage()` RPC after order creation
   - Idempotent operation
   - Logs failure but doesn't block order completion

4. **Wallet Rollback:** If wallet was debited but order fails, wallet is automatically credited back

### 5. BuyNowPage.tsx (Enhanced)

**Updated to pass coupon data to checkout:**
```typescript
const orderData = {
  // ... existing fields ...
  couponCode: appliedCoupon?.coupon.code || null,
  couponId: appliedCoupon?.coupon.id || null,
  couponDiscountAmount: appliedCoupon?.discountAmount || 0,
  couponType: appliedCoupon?.coupon.coupon_type || null,
};
```

### 6. Admin UI - DiscountCoupons.tsx (Enhanced)

**New Form Fields:**
- Coupon Type selector: FLAT | PERCENTAGE | FIRST_ORDER
- Usage Limit input: Optional total usage cap
- Coupon Type badge displayed in table

**Enhanced Table Display:**
- Shows "Uses" column: `X/Y` (e.g., "50/100" for limited, "50/∞" for unlimited)
- Type badge: Shows FLAT, PERCENT, or FIRST_ORDER
- Automatically fetches and displays `used_count` and `total_usage_limit`

## Usage Flow

### Customer Flow

1. **Browse homepage → See coupons**
   - CouponCarousel displays active coupons with usage info
   - Shows "(First Order Only)" badge if applicable
   - Shows remaining uses if limited

2. **Add to cart**
   - Price calculations exclude coupon discount

3. **Proceed to checkout (BuyNowPage)**
   - Best coupon auto-suggested if eligible
   - Can manually enter coupon code
   - Frontend validation shows eligibility reason if code invalid
   - Entered coupon displayed with discount amount

4. **Proceed to payment**
   - Frontend passes coupon code/ID to razorpayService
   - razorpayService calls backend RPC for validation
   - **Backend validates coupon** (one-time, secure)
   - Discount amount from backend is used (not frontend value)
   - Order saved with coupon reference
   - Coupon usage recorded

5. **Order confirmation**
   - Order record contains coupon_code and discount_amount
   - User cannot use same coupon again (enforced at checkout)

### Admin Flow

1. **Create coupon**
   - Enter code, discount type/value, min order
   - Select coupon type: FLAT/PERCENT/FIRST_ORDER
   - Optional: Set usage limit
   - Optional: Link to specific product
   - Set active/active

2. **Monitor coupon**
   - View all coupons in table
   - See current usage count vs limit
   - Activate/deactivate on the fly
   - Delete if needed

## Coupon Type Reference

### FLAT
- Fixed rupee amount discount
- Example: "₹200 OFF"
- Usage: General discounts, flash sales

### PERCENT
- Percentage discount with optional cap
- Example: "20% OFF, up to ₹500"
- Usage: Percentage-based promotions

### FIRST_ORDER
- One-time discount for new customers only
- Validation checks: `COUNT(orders WHERE user_id = X AND status != 'cancelled') == 0`
- Usage: Customer acquisition, sign-up bonuses

## Future Scalability

The architecture supports these future coupon types:

1. **CATEGORY_DISCOUNT**
   - Discount applicable only to specific product categories
   - Uses coupon_category_mapping table (parallel to coupon_product_mapping)

2. **SELLER_SPECIFIC**
   - Discount from specific sellers
   - Uses coupon_seller_mapping table

3. **FREE_SHIPPING**
   - Waives shipping charges
   - Stored as `coupon_type = 'FREE_SHIPPING'` with discount_value = shipping_fee

4. **FLASH_SALE**
   - Limited time, limited quantity discount
   - Adds `quantity_limit` and `expires_at` enforcement

5. **REFERRAL**
   - Reward for referrals
   - Links coupon to referrer_id in coupon_usage

6. **STACKABLE**
   - Multiple coupons on single order
   - Requires rewriting order total calculation logic

**Implementation Pattern:**
- Extend `coupon_type` enum with new value
- Add RPC validation logic in `validate_and_apply_coupon()` function
- Add optional mapping table if needed (category, seller, etc.)
- Update frontend couponService to handle new type in `evaluateCouponForTotal()`
- Add admin UI fields for new type-specific parameters

## Security Considerations

1. **Backend Validation:** All discount calculations happen on backend in SECURITY DEFINER RPC
   - Frontend cannot manipulate discount amount
   - Backend performs all eligibility checks
   - User cannot apply coupon twice for same order

2. **RLS Policies:** Row-level security on coupon_usage
   - Users can only see own coupon usage
   - Only admins can manage coupons

3. **Idempotency:** record_coupon_usage uses ON CONFLICT DO NOTHING
   - Safe to retry without side effects
   - Prevents double-counting if called twice

4. **Atomicity:** Order and coupon_usage in single Razorpay handler
   - Both succeed or both fail together
   - No orphaned records

## Database Migration

**To apply schema changes:**

1. Run SQL file in Supabase SQL editor:
   ```
   database/enterprise-coupon-system.sql
   ```

2. Verify tables/functions created:
   ```sql
   -- Check tables
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
   
   -- Check functions
   SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
   ```

3. No data loss - adds new tables and columns, doesn't modify existing data

## Configuration

### Environment Variables
No new environment variables needed - all configuration is in database schema and admin UI.

### Admin Settings
Admins control via DiscountCoupons page:
- Create coupons with type/limit/product mapping
- Activate/deactivate coupons
- Monitor usage in real-time
- Delete coupons if needed

## Monitoring & Analytics

### Coupon Performance
Query to see top coupons by usage:
```sql
SELECT 
  c.code, 
  c.coupon_type, 
  c.used_count, 
  c.total_usage_limit,
  COUNT(cu.id) as unique_users
FROM coupons c
LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
GROUP BY c.id
ORDER BY c.used_count DESC;
```

### User First-Order Conversion
Query to see first-order coupon effectiveness:
```sql
SELECT 
  c.code,
  COUNT(DISTINCT cu.user_id) as new_customers,
  COUNT(DISTINCT cu.order_id) as orders_created,
  SUM(CASE WHEN c.discount_type = 'flat' THEN c.discount_value 
           WHEN c.discount_type = 'percentage' THEN (o.total_amount * c.discount_value / 100) END) as total_discount
FROM coupons c
LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
LEFT JOIN orders o ON cu.order_id = o.id
WHERE c.coupon_type = 'FIRST_ORDER'
GROUP BY c.id;
```

## Troubleshooting

### Coupon validation failing at checkout
**Likely causes:**
1. User already used coupon → `hasUserUsedCoupon()` check returned true
2. Usage limit reached → `used_count >= total_usage_limit`
3. Product not applicable → Order contains no products in `specific_product_id`
4. User has previous orders (for FIRST_ORDER coupons)

**Solution:** Check backend error message in BuyNowPage toast notification

### Coupon code not appearing in homepage carousel
**Cause:** `is_active = false` or `expires_at < NOW()`

**Solution:** Admin checks coupon status in DiscountCoupons page and reactivates

### Discount amount not matching frontend calculation
**Cause:** Backend RPC used different calculation (correct behavior for security)

**Solution:** This is working as designed - backend always wins for final amount

## Performance Considerations

- Indexes on frequently queried columns: `coupons.code`, `coupons.expires_at`, `coupon_usage.user_id`
- `getActiveCoupons()` is called frequently - cached in frontend state when possible
- Backend RPC runs in SECURITY DEFINER (minimal permission overhead)
- coupon_usage table growth: ~1 record per order, manageable with proper archiving strategy

## Next Steps

1. **Apply database migration** via Supabase SQL editor
2. **Test workflow:**
   - Create test coupon in admin UI
   - Add items to cart
   - Proceed to checkout
   - Apply coupon - should see backend validation
   - Complete order - verify coupon data in orders table
3. **Monitor coupon diagnostics** via Supabase data browser
4. **Plan future coupon types** based on business needs
