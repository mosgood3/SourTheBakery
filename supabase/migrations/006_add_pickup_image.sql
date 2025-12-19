-- Add image_url column to pickups table
ALTER TABLE pickups ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN pickups.image_url IS 'URL to the pickup event cover image stored in Supabase Storage';
