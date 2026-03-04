-- ============================================
-- ADD size_required COLUMN TO PRODUCT TABLES
-- ============================================
-- Run this in Supabase SQL Editor ONCE.
-- Safe to re-run: uses IF NOT EXISTS.
-- ============================================

-- Add size_required to women_products
ALTER TABLE women_products
  ADD COLUMN IF NOT EXISTS size_required BOOLEAN DEFAULT true;

-- Add size_required to girls_products
ALTER TABLE girls_products
  ADD COLUMN IF NOT EXISTS size_required BOOLEAN DEFAULT true;

-- Add size_required to babies_products
ALTER TABLE babies_products
  ADD COLUMN IF NOT EXISTS size_required BOOLEAN DEFAULT true;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
