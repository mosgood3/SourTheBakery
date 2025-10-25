-- Create recipes table (simple version without RLS first)
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price TEXT NOT NULL,
  image TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create recipe_purchases table
CREATE TABLE IF NOT EXISTS public.recipe_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_name TEXT NOT NULL,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  price TEXT NOT NULL,
  download_url TEXT NOT NULL,
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON public.recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_purchases_created_at ON public.recipe_purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_purchases_recipe_id ON public.recipe_purchases(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_purchases_customer_email ON public.recipe_purchases(customer_email);
