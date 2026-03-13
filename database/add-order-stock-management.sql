-- ============================================================
-- Order-driven stock management for product variants
-- ============================================================

-- Track whether inventory has already been applied for each order row.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS inventory_applied BOOLEAN NOT NULL DEFAULT false;

-- Historical rows remain false by default. Only new lifecycle transitions will adjust stock.
-- If you need historical reconciliation, do it with a separate audited script.

CREATE OR REPLACE FUNCTION adjust_variant_stock(p_variant_id UUID, p_delta INTEGER)
RETURNS VOID AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  IF p_variant_id IS NULL OR p_delta = 0 THEN
    RETURN;
  END IF;

  IF p_delta > 0 THEN
    SELECT stock_quantity
    INTO current_stock
    FROM product_variants
    WHERE id = p_variant_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variant % not found while deducting stock', p_variant_id;
    END IF;

    UPDATE product_variants
    SET stock_quantity = stock_quantity - p_delta
    WHERE id = p_variant_id
      AND stock_quantity >= p_delta;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for variant % (available: %, requested: %)', p_variant_id, current_stock, p_delta;
    END IF;
  ELSE
    UPDATE product_variants
    SET stock_quantity = stock_quantity + ABS(p_delta)
    WHERE id = p_variant_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variant % not found while restoring stock', p_variant_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION adjust_variant_stock(UUID, INTEGER)
  SECURITY DEFINER
  SET search_path = public;

CREATE OR REPLACE FUNCTION sync_order_variant_inventory()
RETURNS TRIGGER AS $$
DECLARE
  old_applied BOOLEAN := false;
  new_should_apply BOOLEAN := (
    NEW.variant_id IS NOT NULL
    AND NEW.payment_status = 'completed'
    AND NEW.order_status <> 'cancelled'
  );
  qty_delta INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF new_should_apply THEN
      PERFORM adjust_variant_stock(NEW.variant_id, NEW.quantity);
      NEW.inventory_applied := true;
    ELSE
      NEW.inventory_applied := false;
    END IF;

    RETURN NEW;
  END IF;

  old_applied := COALESCE(OLD.inventory_applied, false);

  -- UPDATE flow
  IF old_applied AND NOT new_should_apply THEN
    -- Order moved to non-stock-impacting state (cancelled/failed/refunded/no variant)
    PERFORM adjust_variant_stock(OLD.variant_id, -OLD.quantity);
    NEW.inventory_applied := false;
    RETURN NEW;
  END IF;

  IF NOT old_applied AND new_should_apply THEN
    -- Order moved to stock-impacting state
    PERFORM adjust_variant_stock(NEW.variant_id, NEW.quantity);
    NEW.inventory_applied := true;
    RETURN NEW;
  END IF;

  IF old_applied AND new_should_apply THEN
    -- Order continues to impact stock; adjust by quantity/variant delta.
    IF OLD.variant_id = NEW.variant_id THEN
      qty_delta := NEW.quantity - OLD.quantity;
      IF qty_delta <> 0 THEN
        PERFORM adjust_variant_stock(NEW.variant_id, qty_delta);
      END IF;
    ELSE
      -- Variant changed: restore old and deduct new atomically in one transaction.
      PERFORM adjust_variant_stock(OLD.variant_id, -OLD.quantity);
      PERFORM adjust_variant_stock(NEW.variant_id, NEW.quantity);
    END IF;

    NEW.inventory_applied := true;
    RETURN NEW;
  END IF;

  NEW.inventory_applied := false;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION sync_order_variant_inventory()
  SECURITY DEFINER
  SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_order_variant_inventory ON orders;

CREATE TRIGGER trg_sync_order_variant_inventory
BEFORE INSERT OR UPDATE OF variant_id, quantity, payment_status, order_status
ON orders
FOR EACH ROW
EXECUTE FUNCTION sync_order_variant_inventory();

NOTIFY pgrst, 'reload schema';