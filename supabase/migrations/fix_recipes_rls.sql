-- Fix RLS policies for recipes tables
-- This migration ensures proper access to recipes for both public and authenticated users

-- Drop existing policies if they exist (to avoid conflicts)
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
-- Allow EVERYONE (public and authenticated) to read recipes
CREATE POLICY "Allow public read access to recipes"
  ON public.recipes
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert recipes
CREATE POLICY "Allow authenticated users to insert recipes"
  ON public.recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update recipes
CREATE POLICY "Allow authenticated users to update recipes"
  ON public.recipes
  FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete recipes
CREATE POLICY "Allow authenticated users to delete recipes"
  ON public.recipes
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for recipe_purchases table
-- Allow EVERYONE to insert purchases (needed for Stripe webhook)
CREATE POLICY "Allow public insert to recipe_purchases"
  ON public.recipe_purchases
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow authenticated users to read recipe purchases
CREATE POLICY "Allow authenticated users to read recipe_purchases"
  ON public.recipe_purchases
  FOR SELECT
  TO authenticated
  USING (true);
