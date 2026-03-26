-- Enterprise Coupon System Migration
-- Adds usage tracking, product mapping, and backend validation for production-grade coupon functionality

-- 1. Enhance coupons table with new fields
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS coupon_type VARCHAR(20) DEFAULT 'FLAT' CHECK (coupon_type IN ('FLAT', 'PERCENT', 'FIRST_ORDER'));
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS total_usage_limit INTEGER CHECK (total_usage_limit IS NULL OR total_usage_limit > 0);
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0 CHECK (used_count >= 0);
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS specific_product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- 2. Create coupon_usage table for tracking user coupon usage
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure one coupon per user per order
  UNIQUE(coupon_id, user_id, order_id),
  -- Index for fast lookups
  UNIQUE(order_id, coupon_id)
);

-- RLS for coupon_usage
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupon_usage_read_own"
  ON coupon_usage FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND role = 'authenticated'
  ));

CREATE POLICY "coupon_usage_insert_auth"
  ON coupon_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Create coupon_product_mapping table
CREATE TABLE IF NOT EXISTS coupon_product_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- One product per coupon
  UNIQUE(coupon_id, product_id)
);

-- RLS for coupon_product_mapping
ALTER TABLE coupon_product_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupon_product_mapping_read_all"
  ON coupon_product_mapping FOR SELECT
  USING (true);

CREATE POLICY "coupon_product_mapping_manage_admin"
  ON coupon_product_mapping FOR ALL
  USING (EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND role = 'admin'
  ));

-- 4. Enhance orders table with coupon fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount_amount NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_type VARCHAR(20);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order_id ON coupon_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_coupon_product_mapping_product_id ON coupon_product_mapping(product_id);
CREATE INDEX IF NOT EXISTS idx_coupon_product_mapping_coupon_id ON coupon_product_mapping(coupon_id);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id);

-- 6. Trigger to update used_count when coupon is used
CREATE OR REPLACE FUNCTION update_coupon_used_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coupons SET used_count = used_count + 1 WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_coupon_usage_update_count ON coupon_usage;
CREATE TRIGGER trigger_coupon_usage_update_count
AFTER INSERT ON coupon_usage
FOR EACH ROW
EXECUTE FUNCTION update_coupon_used_count();

-- 7. Backend RPC function for validating and applying coupons
CREATE OR REPLACE FUNCTION validate_and_apply_coupon(
  p_coupon_code VARCHAR,
  p_user_id UUID,
  p_order_total NUMERIC,
  p_product_ids UUID[]
)
RETURNS TABLE(
  success BOOLEAN,
  coupon_id UUID,
  discount_amount NUMERIC,
  coupon_type VARCHAR,
  error_message TEXT
) AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
  v_user_orders_count INTEGER;
  v_already_used BOOLEAN;
  v_discount NUMERIC;
  v_product_applicable BOOLEAN;
BEGIN
  -- 1. Check if coupon exists and is active
  SELECT * INTO v_coupon FROM coupons 
  WHERE code = p_coupon_code AND is_active = true;
  
  IF v_coupon.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::NUMERIC, NULL::VARCHAR, 'Coupon not found or inactive'::TEXT;
    RETURN;
  END IF;
  
  -- 2. Check if coupon has expired
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
    RETURN QUERY SELECT false, v_coupon.id, 0::NUMERIC, v_coupon.coupon_type, 'Coupon has expired'::TEXT;
    RETURN;
  END IF;
  
  -- 3. Check usage limit (total limit across all users)
  IF v_coupon.total_usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.total_usage_limit THEN
    RETURN QUERY SELECT false, v_coupon.id, 0::NUMERIC, v_coupon.coupon_type, 'Coupon usage limit exceeded'::TEXT;
    RETURN;
  END IF;
  
  -- 4. Check if user already used this coupon
  SELECT EXISTS(
    SELECT 1 FROM coupon_usage WHERE coupon_id = v_coupon.id AND user_id = p_user_id
  ) INTO v_already_used;
  
  IF v_already_used THEN
    RETURN QUERY SELECT false, v_coupon.id, 0::NUMERIC, v_coupon.coupon_type, 'You have already used this coupon'::TEXT;
    RETURN;
  END IF;
  
  -- 5. Check minimum order value
  IF p_order_total < v_coupon.min_order_value THEN
    RETURN QUERY SELECT false, v_coupon.id, 0::NUMERIC, v_coupon.coupon_type, 
      'Order total must be at least ' || v_coupon.min_order_value::TEXT || ' to use this coupon'::TEXT;
    RETURN;
  END IF;
  
  -- 6. Check if coupon is product-specific and applicable
  IF v_coupon.specific_product_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM unnest(p_product_ids) AS product_id 
      WHERE product_id = v_coupon.specific_product_id
    ) INTO v_product_applicable;
    
    IF NOT v_product_applicable THEN
      RETURN QUERY SELECT false, v_coupon.id, 0::NUMERIC, v_coupon.coupon_type, 
        'This coupon is not applicable to items in your cart'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- 7. Calculate discount amount
  IF v_coupon.coupon_type = 'FLAT' THEN
    v_discount := v_coupon.discount_value;
  ELSIF v_coupon.coupon_type = 'PERCENT' THEN
    v_discount := (p_order_total * v_coupon.discount_value) / 100;
  ELSIF v_coupon.coupon_type = 'FIRST_ORDER' THEN
    -- Check if user has any orders
    SELECT COUNT(*) INTO v_user_orders_count FROM orders WHERE user_id = p_user_id AND status != 'cancelled';
    
    IF v_user_orders_count > 0 THEN
      RETURN QUERY SELECT false, v_coupon.id, 0::NUMERIC, 'FIRST_ORDER', 'This coupon is only for first-time orders'::TEXT;
      RETURN;
    END IF;
    
    v_discount := v_coupon.discount_value;
  ELSE
    RETURN QUERY SELECT false, v_coupon.id, 0::NUMERIC, v_coupon.coupon_type, 'Unknown coupon type'::TEXT;
    RETURN;
  END IF;
  
  -- 8. Apply max discount cap if set
  IF v_coupon.max_discount IS NOT NULL AND v_discount > v_coupon.max_discount THEN
    v_discount := v_coupon.max_discount;
  END IF;
  
  -- 9. Ensure discount doesn't exceed order total
  IF v_discount > p_order_total THEN
    v_discount := p_order_total;
  END IF;
  
  -- Return success with discount details
  RETURN QUERY SELECT true, v_coupon.id, v_discount, v_coupon.coupon_type, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function to record coupon usage (called after successful order placement)
CREATE OR REPLACE FUNCTION record_coupon_usage(
  p_coupon_id UUID,
  p_user_id UUID,
  p_order_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  error_message TEXT
) AS $$
BEGIN
  INSERT INTO coupon_usage (coupon_id, user_id, order_id, used_at)
  VALUES (p_coupon_id, p_user_id, p_order_id, now())
  ON CONFLICT (coupon_id, user_id, order_id) DO NOTHING;
  
  RETURN QUERY SELECT true, NULL::TEXT;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION validate_and_apply_coupon(VARCHAR, UUID, NUMERIC, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION record_coupon_usage(UUID, UUID, UUID) TO authenticated;

-- 10. Create indexes for frequently queried coupons
CREATE INDEX IF NOT EXISTS idx_coupons_code_active ON coupons(code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON coupons(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coupons_specific_product ON coupons(specific_product_id) WHERE specific_product_id IS NOT NULL;

-- 11. Add comment for documentation
COMMENT ON TABLE coupon_usage IS 'Tracks which users have used which coupons on which orders. Ensures one-time usage enforcement and analytics.';
COMMENT ON TABLE coupon_product_mapping IS 'Maps coupons to specific products. If a product is mapped, coupon only applies to carts containing that product.';
COMMENT ON COLUMN coupons.coupon_type IS 'Type of coupon: FLAT (fixed amount), PERCENT (percentage discount), FIRST_ORDER (first purchase only)';
COMMENT ON COLUMN coupons.total_usage_limit IS 'Maximum total uses across all users. NULL means unlimited.';
COMMENT ON COLUMN coupons.used_count IS 'Current count of uses. Auto-updated via trigger.';
COMMENT ON COLUMN coupons.specific_product_id IS 'If set, coupon only applies to this specific product. NULL means applies to any product.';
COMMENT ON FUNCTION validate_and_apply_coupon(VARCHAR, UUID, NUMERIC, UUID[]) IS 
'Backend validation of coupon eligibility. Checks: exists/active, not expired, usage limit, user already used, min order, product applicability, discount calculation. Returns success flag + discount amount or error message.';
COMMENT ON FUNCTION record_coupon_usage(UUID, UUID, UUID) IS 'Records coupon usage after successful order. Idempotent (uses ON CONFLICT DO NOTHING for safety).';
