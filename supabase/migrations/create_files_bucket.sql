-- Create files bucket for PDFs and other documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for files bucket
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
