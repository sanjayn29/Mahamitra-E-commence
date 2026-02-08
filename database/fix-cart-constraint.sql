-- Fix cart_items unique constraint to include size and color
-- This allows users to add the same product with different sizes/colors

-- Drop the old constraint
ALTER TABLE cart_items 
DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_product_type_key;

-- Add the correct constraint including size and color
ALTER TABLE cart_items 
ADD CONSTRAINT cart_items_user_id_product_id_product_type_size_color_key 
UNIQUE (user_id, product_id, product_type, size, color);

-- Note: Run this in your Supabase SQL Editor
