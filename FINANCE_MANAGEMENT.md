# Finance Management

This project derives finance analytics from the existing ecommerce data model. The app does not duplicate order revenue into a second reporting table.

## Schema Support

Migration: [database/add-finance-management.sql](database/add-finance-management.sql)

Adds:

- `profiles.wallet_balance NUMERIC(12,2) DEFAULT 0`
- `finance_events`

`finance_events` schema:

```sql
CREATE TABLE finance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('ORDER_PAYMENT', 'REFUND', 'WALLET_CREDIT', 'WALLET_DEBIT')),
  reference_id TEXT,
  amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

RLS:

- users can view only their own finance events
- admins can view and manage all finance events

## Metric Queries

Note: this project stores one row per purchased item in `orders`. For checkout-level metrics such as average order value, group by `payment_id` when present and fall back to `id` for single-line orders.

### Customer Metrics

Total money spent:

```sql
SELECT COALESCE(SUM(total_amount), 0) AS total_spent
FROM orders
WHERE user_id = auth.uid()
  AND payment_status = 'completed';
```

Monthly spending:

```sql
SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
       SUM(total_amount) AS total_spent
FROM orders
WHERE user_id = auth.uid()
  AND payment_status = 'completed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY DATE_TRUNC('month', created_at);
```

Order value insights grouped by checkout:

```sql
WITH grouped_orders AS (
  SELECT COALESCE(payment_id, id::text) AS order_group,
         SUM(total_amount) AS order_value
  FROM orders
  WHERE user_id = auth.uid()
    AND payment_status = 'completed'
  GROUP BY COALESCE(payment_id, id::text)
)
SELECT COALESCE(AVG(order_value), 0) AS average_order_value,
       COALESCE(MAX(order_value), 0) AS highest_order_value,
       COALESCE(MIN(order_value), 0) AS lowest_order_value
FROM grouped_orders;
```

Product spending breakdown by category:

```sql
SELECT p.category,
       SUM(o.total_amount) AS total_spent
FROM orders o
JOIN products p ON p.product_public_id = o.product_id
WHERE o.user_id = auth.uid()
  AND o.payment_status = 'completed'
GROUP BY p.category
ORDER BY total_spent DESC;
```

Refund tracking:

```sql
SELECT COALESCE(SUM(total_amount), 0) AS total_refunded,
       COUNT(*) AS refunded_orders
FROM orders
WHERE user_id = auth.uid()
  AND payment_status = 'refunded';
```

Payment history ledger:

```sql
SELECT created_at,
       COALESCE(payment_id, id::text) AS order_reference,
       total_amount,
       payment_status,
       order_status
FROM orders
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### Admin Metrics

Total revenue:

```sql
SELECT COALESCE(SUM(total_amount), 0) AS total_revenue
FROM orders
WHERE payment_status = 'completed';
```

Monthly revenue:

```sql
SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
       SUM(total_amount) AS total_revenue
FROM orders
WHERE payment_status = 'completed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY DATE_TRUNC('month', created_at);
```

Daily sales count:

```sql
SELECT DATE(created_at) AS sale_date,
       COUNT(DISTINCT COALESCE(payment_id, id::text)) AS total_orders
FROM orders
WHERE payment_status = 'completed'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;
```

Top selling products:

```sql
SELECT product_id,
       product_name,
       SUM(quantity) AS units_sold,
       SUM(total_amount) AS revenue
FROM orders
WHERE payment_status = 'completed'
GROUP BY product_id, product_name
ORDER BY units_sold DESC
LIMIT 10;
```

Revenue by product category:

```sql
SELECT p.category,
       SUM(o.total_amount) AS total_revenue
FROM orders o
JOIN products p ON p.product_public_id = o.product_id
WHERE o.payment_status = 'completed'
GROUP BY p.category
ORDER BY total_revenue DESC;
```

Average order value:

```sql
WITH grouped_orders AS (
  SELECT COALESCE(payment_id, id::text) AS order_group,
         SUM(total_amount) AS order_value
  FROM orders
  WHERE payment_status = 'completed'
  GROUP BY COALESCE(payment_id, id::text)
)
SELECT COALESCE(AVG(order_value), 0) AS average_order_value
FROM grouped_orders;
```

Inventory value:

```sql
SELECT COALESCE(SUM(v.stock_quantity * COALESCE(v.price_override, base.cost)), 0) AS inventory_value
FROM product_variants v
JOIN (
  SELECT "productId" AS product_id, cost FROM women_products
  UNION ALL
  SELECT "productId" AS product_id, cost FROM girls_products
  UNION ALL
  SELECT "productId" AS product_id, cost FROM babies_products
) base ON base.product_id = v.product_public_id;
```

Pending orders value:

```sql
SELECT COALESCE(SUM(total_amount), 0) AS pending_orders_value
FROM orders
WHERE payment_status = 'completed'
  AND order_status IN ('pending', 'confirmed', 'processing', 'shipped');
```

Refund analytics:

```sql
WITH totals AS (
  SELECT COALESCE(SUM(CASE WHEN payment_status = 'refunded' THEN total_amount ELSE 0 END), 0) AS refunded_amount,
         COUNT(*) FILTER (WHERE payment_status = 'refunded') AS refunded_orders,
         COALESCE(SUM(CASE WHEN payment_status IN ('completed', 'refunded') THEN total_amount ELSE 0 END), 0) AS gross_amount
  FROM orders
)
SELECT refunded_amount,
       refunded_orders,
       CASE WHEN gross_amount = 0 THEN 0 ELSE ROUND((refunded_amount / gross_amount) * 100, 2) END AS refund_percentage
FROM totals;
```

Customer lifetime value:

```sql
WITH user_totals AS (
  SELECT user_id,
         SUM(total_amount) AS lifetime_value
  FROM orders
  WHERE payment_status = 'completed'
  GROUP BY user_id
)
SELECT COALESCE(AVG(lifetime_value), 0) AS average_customer_lifetime_value
FROM user_totals;
```

## Frontend Integration

- Customer profile renders a `Financial Summary` section with cards, charts, breakdowns, refunds, and payment ledger.
- Admin dashboard renders a `Financial Analytics` section with summary cards and key charts.
- Analytics page reuses the same finance service and expands the dataset into charts and ranked tables.

## Integration Order

1. Run [database/add-finance-management.sql](database/add-finance-management.sql)
2. Ensure order/variant migrations are already applied
3. Build and test:

```bash
npm run build
```