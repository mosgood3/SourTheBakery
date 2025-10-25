-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies for newsletter_subscribers table
-- Allow anyone to subscribe (insert) - both authenticated and anonymous
CREATE POLICY "Allow public insert to newsletter_subscribers"
  ON public.newsletter_subscribers
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow anyone to read subscribers (needed for duplicate check)
CREATE POLICY "Allow public read to newsletter_subscribers"
  ON public.newsletter_subscribers
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users (admin) to delete subscribers
CREATE POLICY "Allow authenticated users to delete newsletter_subscribers"
  ON public.newsletter_subscribers
  FOR DELETE
  TO authenticated
  USING (true);

-- Allow authenticated users (admin) to update subscribers
CREATE POLICY "Allow authenticated users to update newsletter_subscribers"
  ON public.newsletter_subscribers
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at ON public.newsletter_subscribers(subscribed_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_is_active ON public.newsletter_subscribers(is_active);
