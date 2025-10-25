-- Create images bucket for product photos, recipes, gallery, etc.
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for images bucket
-- Allow public read access to images
CREATE POLICY "Allow public read access to images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'images');

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated uploads to images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images');

-- Allow authenticated users to update images
CREATE POLICY "Allow authenticated updates to images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'images');

-- Allow authenticated users to delete images
CREATE POLICY "Allow authenticated deletes from images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'images');
