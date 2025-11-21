-- Add archived column to products table
-- This allows products to be soft-deleted (hidden) instead of permanently removed

ALTER TABLE products ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Add index for better performance when filtering archived products
CREATE INDEX IF NOT EXISTS idx_products_archived ON products(archived);

-- Update the public read policy to exclude archived products for public view
-- First, drop the existing public view policy
DROP POLICY IF EXISTS "Public can view products" ON products;

-- Create new policy that excludes archived products from public view
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (archived = FALSE);

-- Authenticated users (admins) can still see all products including archived ones
CREATE POLICY "Authenticated users can view all products" ON products
  FOR SELECT USING (auth.role() = 'authenticated');
