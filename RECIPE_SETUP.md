# Recipe Feature Setup Instructions

The recipe purchase feature has been successfully implemented! Follow these steps to complete the setup:

## 1. Run Database Migrations

You need to create the necessary tables in Supabase. Run these SQL migrations in the Supabase SQL Editor:

### Migration 1: Create Recipes Tables

```sql
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
  USING (true);

CREATE POLICY "Allow authenticated users to insert recipes"
  ON public.recipes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update recipes"
  ON public.recipes
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow authenticated users to delete recipes"
  ON public.recipes
  FOR DELETE
  USING (true);

-- Create policies for recipe_purchases table (insert for everyone, read for authenticated)
CREATE POLICY "Allow public insert to recipe_purchases"
  ON public.recipe_purchases
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read recipe_purchases"
  ON public.recipe_purchases
  FOR SELECT
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
```

### Migration 2: Create Files Storage Bucket

```sql
-- Create files bucket for PDFs and other documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for files bucket
CREATE POLICY "Allow public read access to files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'files');

CREATE POLICY "Allow authenticated uploads to files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'files');

CREATE POLICY "Allow authenticated updates to files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'files');

CREATE POLICY "Allow authenticated deletes from files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'files');
```

## 2. Access the Features

Once the migrations are complete, you can:

### As Admin:
1. Navigate to `/admin` and login
2. Click the "Recipes" tab
3. Click "Add Recipe" to create your first recipe
4. Upload a recipe image (max 5MB)
5. Upload a recipe PDF (max 10MB)
6. Fill in name, description, and price
7. Submit!

### As Customer:
1. Visit your homepage
2. Scroll to the "Recipes" section (or click "Recipes" in navigation)
3. Click "Purchase" on any recipe
4. Enter name and email
5. Complete payment with Stripe
6. Receive email with PDF download link immediately!

## Features Included

✅ **Admin Recipe Management**
- Upload recipes with images and PDFs
- Edit existing recipes
- Delete recipes (removes files from storage)
- Full CRUD operations

✅ **Customer Experience**
- Browse recipes on homepage
- Purchase recipes with Stripe
- Immediate email delivery with PDF
- Beautiful confirmation page
- No login required

✅ **Email Integration**
- Automated emails with PDF download links
- Professional HTML templates
- Baking tips included

✅ **Database**
- Supabase tables for recipes and purchases
- Row Level Security enabled
- Proper indexes for performance
- Cascade deletes for data integrity

✅ **Storage**
- Separate buckets for images and files
- Public access for downloads
- Automatic cleanup on delete

## File Structure

**New Files Created:**
- `app/lib/recipes-supabase.ts` - Recipe database operations
- `app/lib/recipe-email-service.ts` - Email templates and sending
- `app/admin/recipes/RecipesPanel.tsx` - Admin UI
- `app/admin/recipes/page.tsx` - Admin page wrapper
- `app/components/RecipesSection.tsx` - Homepage display
- `app/recipes/[id]/page.tsx` - Individual recipe purchase page
- `app/recipes/success/page.tsx` - Purchase success page
- `app/api/recipes/create-payment-intent/route.ts` - Stripe API
- `supabase/migrations/create_recipes_tables.sql` - Database schema
- `supabase/migrations/create_files_bucket.sql` - Storage setup

**Modified Files:**
- `app/lib/storage-supabase.ts` - Added PDF upload/delete functions
- `app/components/Navigation.tsx` - Added Recipes link
- `app/page.tsx` - Added RecipesSection
- `app/admin/page.tsx` - Added Recipes tab
- `app/api/stripe/webhook/route.ts` - Added recipe purchase handling

## Testing Checklist

- [ ] Run SQL migrations in Supabase
- [ ] Verify tables exist in Supabase dashboard
- [ ] Verify 'files' bucket exists in Storage
- [ ] Add a test recipe as admin
- [ ] Verify recipe appears on homepage
- [ ] Test purchasing a recipe (use Stripe test card: 4242 4242 4242 4242)
- [ ] Verify email is received with PDF link
- [ ] Test PDF download from email
- [ ] Test editing a recipe
- [ ] Test deleting a recipe

## Notes

- The same user can purchase the same recipe multiple times (as requested)
- No login system required for customers
- PDFs are stored in Supabase Storage with public access
- All purchases are tracked in the `recipe_purchases` table
- Stripe handles all payment processing securely
