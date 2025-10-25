-- Create newsletter_sends table to log all newsletter emails sent
CREATE TABLE IF NOT EXISTS public.newsletter_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID REFERENCES public.newsletter_subscribers(id) ON DELETE SET NULL,
  subscriber_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  message_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_subscriber_id ON public.newsletter_sends(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_subscriber_email ON public.newsletter_sends(subscriber_email);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_sent_at ON public.newsletter_sends(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_status ON public.newsletter_sends(status);

-- Enable RLS
ALTER TABLE public.newsletter_sends ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (admins) to read all sends
CREATE POLICY "Allow authenticated read access to newsletter_sends"
  ON public.newsletter_sends
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users (admins) to insert send logs
CREATE POLICY "Allow authenticated insert to newsletter_sends"
  ON public.newsletter_sends
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users (admins) to update send logs (e.g., mark as bounced)
CREATE POLICY "Allow authenticated update to newsletter_sends"
  ON public.newsletter_sends
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
