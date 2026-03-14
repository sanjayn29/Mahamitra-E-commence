-- ============================================================
-- Hotfix: avoid failing order updates when restoring stock for
-- variants that were deleted during product edits.
-- ============================================================

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
      -- Variant may have been deleted while old orders still reference it.
      -- Do not block admin/product updates for historical rows.
      RETURN;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION adjust_variant_stock(UUID, INTEGER)
  SECURITY DEFINER
  SET search_path = public;

NOTIFY pgrst, 'reload schema';
