-- ============================================================
-- Customer order cancellation + wallet credit/debit support
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- Debit wallet safely for the authenticated user.
-- Used during checkout when customer opts to pay with wallet balance.
CREATE OR REPLACE FUNCTION debit_wallet_balance(
  p_amount NUMERIC,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_new_balance NUMERIC(12,2);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Debit amount must be greater than zero';
  END IF;

  INSERT INTO profiles (id, wallet_balance)
  VALUES (v_user_id, 0)
  ON CONFLICT (id) DO NOTHING;

  UPDATE profiles
  SET wallet_balance = profiles.wallet_balance - p_amount,
      updated_at = NOW()
  WHERE id = v_user_id
    AND profiles.wallet_balance >= p_amount
  RETURNING profiles.wallet_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  INSERT INTO finance_events (user_id, event_type, reference_id, amount)
  VALUES (v_user_id, 'WALLET_DEBIT', p_reference_id, p_amount);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION debit_wallet_balance(NUMERIC, TEXT)
  SECURITY DEFINER
  SET search_path = public;

GRANT EXECUTE ON FUNCTION debit_wallet_balance(NUMERIC, TEXT) TO authenticated;

-- Credit wallet for the authenticated user.
-- Used for controlled rollback/adjustment flows.
CREATE OR REPLACE FUNCTION credit_wallet_balance(
  p_amount NUMERIC,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_new_balance NUMERIC(12,2);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be greater than zero';
  END IF;

  INSERT INTO profiles (id, wallet_balance)
  VALUES (v_user_id, 0)
  ON CONFLICT (id) DO NOTHING;

  UPDATE profiles
  SET wallet_balance = profiles.wallet_balance + p_amount,
      updated_at = NOW()
  WHERE id = v_user_id
  RETURNING profiles.wallet_balance INTO v_new_balance;

  INSERT INTO finance_events (user_id, event_type, reference_id, amount)
  VALUES (v_user_id, 'WALLET_CREDIT', p_reference_id, p_amount);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION credit_wallet_balance(NUMERIC, TEXT)
  SECURITY DEFINER
  SET search_path = public;

GRANT EXECUTE ON FUNCTION credit_wallet_balance(NUMERIC, TEXT) TO authenticated;

-- Customer can cancel order only before shipment.
-- If payment was completed, money is moved to wallet and payment_status is marked refunded.
CREATE OR REPLACE FUNCTION cancel_order_and_credit_wallet(
  p_order_id UUID
)
RETURNS TABLE (
  order_id UUID,
  wallet_credited NUMERIC,
  wallet_balance NUMERIC,
  payment_refunded BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_order orders%ROWTYPE;
  v_new_wallet_balance NUMERIC(12,2);
  v_wallet_credit NUMERIC(12,2) := 0;
  v_payment_refunded BOOLEAN := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT *
  INTO v_order
  FROM orders
  WHERE id = p_order_id
    AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.order_status IN ('shipped', 'delivered') THEN
    RAISE EXCEPTION 'Order can no longer be cancelled after shipment';
  END IF;

  IF v_order.order_status = 'cancelled' THEN
    SELECT COALESCE(p.wallet_balance, 0)
    INTO v_new_wallet_balance
    FROM profiles p
    WHERE p.id = v_user_id;

    RETURN QUERY
    SELECT v_order.id, 0::NUMERIC, COALESCE(v_new_wallet_balance, 0), (v_order.payment_status = 'refunded'), 'Order is already cancelled';
    RETURN;
  END IF;

  UPDATE orders
  SET order_status = 'cancelled',
      updated_at = NOW()
  WHERE id = v_order.id;

  IF v_order.payment_status = 'completed' THEN
    UPDATE orders
    SET payment_status = 'refunded',
        updated_at = NOW()
    WHERE id = v_order.id;

    INSERT INTO profiles (id, wallet_balance)
    VALUES (v_user_id, 0)
    ON CONFLICT (id) DO NOTHING;

    UPDATE profiles
    SET wallet_balance = profiles.wallet_balance + v_order.total_amount,
        updated_at = NOW()
    WHERE id = v_user_id
    RETURNING profiles.wallet_balance INTO v_new_wallet_balance;

    v_wallet_credit := COALESCE(v_order.total_amount, 0);
    v_payment_refunded := true;

    INSERT INTO finance_events (user_id, event_type, reference_id, amount)
    VALUES
      (v_user_id, 'REFUND', v_order.id::TEXT, v_wallet_credit),
      (v_user_id, 'WALLET_CREDIT', v_order.id::TEXT, v_wallet_credit);
  ELSE
    SELECT COALESCE(p.wallet_balance, 0)
    INTO v_new_wallet_balance
    FROM profiles p
    WHERE p.id = v_user_id;
  END IF;

  RETURN QUERY
  SELECT
    v_order.id,
    v_wallet_credit,
    COALESCE(v_new_wallet_balance, 0),
    v_payment_refunded,
    CASE
      WHEN v_payment_refunded THEN 'Order cancelled and refund credited to wallet'
      ELSE 'Order cancelled'
    END;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION cancel_order_and_credit_wallet(UUID)
  SECURITY DEFINER
  SET search_path = public;

GRANT EXECUTE ON FUNCTION cancel_order_and_credit_wallet(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
