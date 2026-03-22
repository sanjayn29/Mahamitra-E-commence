-- ============================================================
-- Order cancellation metadata + idempotent wallet refund flow
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_by TEXT CHECK (cancelled_by IN ('customer', 'admin')),
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_cancelled_at ON orders(cancelled_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_by ON orders(cancelled_by);

DROP FUNCTION IF EXISTS cancel_order_and_credit_wallet(UUID);

CREATE OR REPLACE FUNCTION cancel_order_and_credit_wallet(
  p_order_id UUID,
  p_cancelled_by TEXT DEFAULT 'customer',
  p_cancellation_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  order_id UUID,
  wallet_credited NUMERIC,
  wallet_balance NUMERIC,
  payment_refunded BOOLEAN,
  refund_status TEXT,
  message TEXT
) AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_admin BOOLEAN := COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::BOOLEAN, false);
  v_order orders%ROWTYPE;
  v_new_wallet_balance NUMERIC(12,2) := 0;
  v_wallet_credit NUMERIC(12,2) := 0;
  v_payment_refunded BOOLEAN := false;
  v_cancellation_reason TEXT := NULLIF(BTRIM(COALESCE(p_cancellation_reason, '')), '');
  v_cancelled_by TEXT := LOWER(COALESCE(p_cancelled_by, 'customer'));
  v_refund_reference TEXT;
  v_wallet_reference TEXT;
  v_existing_refund BOOLEAN := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_cancelled_by NOT IN ('customer', 'admin') THEN
    RAISE EXCEPTION 'cancelled_by must be customer or admin';
  END IF;

  IF v_cancellation_reason IS NULL THEN
    RAISE EXCEPTION 'Cancellation reason is required';
  END IF;

  SELECT *
  INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_cancelled_by = 'customer' THEN
    IF v_order.user_id <> v_user_id THEN
      RAISE EXCEPTION 'You can only cancel your own order';
    END IF;
  ELSIF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin access required to cancel as admin';
  END IF;

  IF v_order.order_status IN ('shipped', 'delivered') THEN
    RAISE EXCEPTION 'Order can no longer be cancelled after shipment';
  END IF;

  v_refund_reference := 'REFUND_ORDER_' || v_order.id::TEXT;
  v_wallet_reference := 'WALLET_REFUND_ORDER_' || v_order.id::TEXT;

  SELECT EXISTS (
    SELECT 1
    FROM finance_events fe
    WHERE fe.event_type = 'REFUND'
      AND fe.reference_id IN (v_refund_reference, v_order.id::TEXT)
  ) INTO v_existing_refund;

  IF v_order.order_status = 'cancelled' THEN
    SELECT COALESCE(p.wallet_balance, 0)
    INTO v_new_wallet_balance
    FROM profiles p
    WHERE p.id = v_order.user_id;

    RETURN QUERY
    SELECT
      v_order.id,
      0::NUMERIC,
      COALESCE(v_new_wallet_balance, 0),
      (v_order.payment_status = 'refunded') OR v_existing_refund,
      CASE
        WHEN (v_order.payment_status = 'refunded') OR v_existing_refund THEN 'already_refunded'
        ELSE 'not_required'
      END,
      'Order is already cancelled';
    RETURN;
  END IF;

  UPDATE orders
  SET order_status = 'cancelled',
      cancellation_reason = v_cancellation_reason,
      cancelled_by = v_cancelled_by,
      cancelled_at = NOW(),
      updated_at = NOW()
  WHERE id = v_order.id;

  IF v_order.payment_status = 'completed' THEN
    IF NOT v_existing_refund THEN
      INSERT INTO profiles (id, wallet_balance)
      VALUES (v_order.user_id, 0)
      ON CONFLICT (id) DO NOTHING;

      UPDATE profiles
      SET wallet_balance = profiles.wallet_balance + v_order.total_amount,
          updated_at = NOW()
      WHERE id = v_order.user_id
      RETURNING profiles.wallet_balance INTO v_new_wallet_balance;

      v_wallet_credit := COALESCE(v_order.total_amount, 0);
      v_payment_refunded := true;

      INSERT INTO finance_events (user_id, event_type, reference_id, amount)
      VALUES
        (v_order.user_id, 'REFUND', v_refund_reference, v_wallet_credit),
        (v_order.user_id, 'WALLET_CREDIT', v_wallet_reference, v_wallet_credit);
    ELSE
      SELECT COALESCE(p.wallet_balance, 0)
      INTO v_new_wallet_balance
      FROM profiles p
      WHERE p.id = v_order.user_id;

      v_payment_refunded := true;
    END IF;

    UPDATE orders
    SET payment_status = 'refunded',
        updated_at = NOW()
    WHERE id = v_order.id
      AND payment_status = 'completed';
  ELSE
    SELECT COALESCE(p.wallet_balance, 0)
    INTO v_new_wallet_balance
    FROM profiles p
    WHERE p.id = v_order.user_id;
  END IF;

  RETURN QUERY
  SELECT
    v_order.id,
    v_wallet_credit,
    COALESCE(v_new_wallet_balance, 0),
    v_payment_refunded,
    CASE
      WHEN v_payment_refunded AND v_wallet_credit > 0 THEN 'refunded'
      WHEN v_payment_refunded THEN 'already_refunded'
      ELSE 'not_required'
    END,
    CASE
      WHEN v_payment_refunded AND v_wallet_credit > 0 THEN 'Order cancelled and refund credited to wallet'
      WHEN v_payment_refunded THEN 'Order cancelled (refund already processed)'
      ELSE 'Order cancelled'
    END;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION cancel_order_and_credit_wallet(UUID, TEXT, TEXT)
  SECURITY DEFINER
  SET search_path = public;

GRANT EXECUTE ON FUNCTION cancel_order_and_credit_wallet(UUID, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';