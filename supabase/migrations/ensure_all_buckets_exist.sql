-- Ensure both images and files buckets exist with proper configuration
-- This migration is idempotent and safe to run multiple times

-- Create images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Create files bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'files',
  'files',
  true,
  10485760, -- 10MB limit for PDFs
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf'];

-- Drop and recreate all storage policies to ensure they're correct
-- Storage policies for images bucket
DROP POLICY IF EXISTS "Allow public read access to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from images" ON storage.objects;

CREATE POLICY "Allow public read access to images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'images');

CREATE POLICY "Allow authenticated uploads to images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated updates to images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated deletes from images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Storage policies for files bucket
DROP POLICY IF EXISTS "Allow public read access to files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from files" ON storage.objects;

CREATE POLICY "Allow public read access to files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'files');

CREATE POLICY "Allow authenticated uploads to files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'files' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated updates to files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'files' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated deletes from files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'files' AND auth.role() = 'authenticated');
