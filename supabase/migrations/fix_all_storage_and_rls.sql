-- Comprehensive fix for all storage buckets and RLS policies
-- Run this migration to fix both the recipes fetching issue and bucket not found error

-- ============================================
-- PART 1: Create missing images bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PART 2: Fix storage policies
-- ============================================

-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from images" ON storage.objects;

DROP POLICY IF EXISTS "Allow public read access to files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from files" ON storage.objects;

-- Create proper storage policies for images bucket
CREATE POLICY "Allow public read access to images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'images');

CREATE POLICY "Allow authenticated uploads to images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow authenticated updates to images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'images');

CREATE POLICY "Allow authenticated deletes from images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'images');

-- Create proper storage policies for files bucket
CREATE POLICY "Allow public read access to files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'files');

CREATE POLICY "Allow authenticated uploads to files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'files');

CREATE POLICY "Allow authenticated updates to files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'files');

CREATE POLICY "Allow authenticated deletes from files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'files');

-- ============================================
-- PART 3: Fix RLS policies for recipes tables
-- ============================================

-- Drop existing policies for recipes tables to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to recipes" ON public.recipes;
DROP POLICY IF EXISTS "Allow authenticated users to insert recipes" ON public.recipes;
DROP POLICY IF EXISTS "Allow authenticated users to update recipes" ON public.recipes;
DROP POLICY IF EXISTS "Allow authenticated users to delete recipes" ON public.recipes;
DROP POLICY IF EXISTS "Allow public insert to recipe_purchases" ON public.recipe_purchases;
DROP POLICY IF EXISTS "Allow authenticated users to read recipe_purchases" ON public.recipe_purchases;

-- Enable Row Level Security (if not already enabled)
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for recipes table
CREATE POLICY "Allow public read access to recipes"
  ON public.recipes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert recipes"
  ON public.recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update recipes"
  ON public.recipes
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete recipes"
  ON public.recipes
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for recipe_purchases table
CREATE POLICY "Allow public insert to recipe_purchases"
  ON public.recipe_purchases
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read recipe_purchases"
  ON public.recipe_purchases
  FOR SELECT
  TO authenticated
  USING (true);
