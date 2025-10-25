-- Create recipes table
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

-- Enable Row Level Security
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for recipes table (read access for everyone, write access for authenticated users)
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

-- Create policies for recipe_purchases table (insert for everyone, read for authenticated)
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON public.recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_purchases_created_at ON public.recipe_purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_purchases_recipe_id ON public.recipe_purchases(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_purchases_customer_email ON public.recipe_purchases(customer_email);

-- Create updated_at trigger for recipes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
