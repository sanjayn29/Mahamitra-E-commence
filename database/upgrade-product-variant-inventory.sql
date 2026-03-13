-- ============================================================
-- Upgrade existing color-only variants to color + size inventory
-- Run this after add-variants-reviews-addresses.sql on existing DBs
-- ============================================================

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS size TEXT;

UPDATE product_variants
SET size = 'Free Size'
WHERE size IS NULL OR btrim(size) = '';

ALTER TABLE product_variants
  ALTER COLUMN size SET NOT NULL,
  ALTER COLUMN size SET DEFAULT 'Free Size';

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_variants'
      AND column_name = 'stock'
  ) THEN
    EXECUTE '
      UPDATE product_variants
      SET stock_quantity = COALESCE(stock_quantity, stock, 0)
      WHERE stock_quantity IS NULL
    ';
  ELSE
    EXECUTE '
      UPDATE product_variants
      SET stock_quantity = COALESCE(stock_quantity, 0)
      WHERE stock_quantity IS NULL
    ';
  END IF;
END
$$;

ALTER TABLE product_variants
  ALTER COLUMN stock_quantity SET NOT NULL,
  ALTER COLUMN stock_quantity SET DEFAULT 0;

ALTER TABLE product_variants
  DROP CONSTRAINT IF EXISTS product_variants_product_id_color_key,
  DROP CONSTRAINT IF EXISTS product_variants_product_public_id_product_category_color_key;

DROP INDEX IF EXISTS idx_product_variants_option_lookup;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_variants'
      AND column_name = 'stock'
  ) THEN
    ALTER TABLE product_variants DROP COLUMN stock;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_variants_product_id_color_size_key'
      AND conrelid = 'product_variants'::regclass
  ) THEN
    ALTER TABLE product_variants
      ADD CONSTRAINT product_variants_product_id_color_size_key UNIQUE (product_id, color, size);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_variants_product_public_id_product_category_color_size_key'
      AND conrelid = 'product_variants'::regclass
  ) THEN
    ALTER TABLE product_variants
      ADD CONSTRAINT product_variants_product_public_id_product_category_color_size_key
      UNIQUE (product_public_id, product_category, color, size);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_lookup ON product_variants(product_public_id, product_category);
CREATE INDEX IF NOT EXISTS idx_product_variants_option_lookup ON product_variants(product_public_id, product_category, color, size);

NOTIFY pgrst, 'reload schema';