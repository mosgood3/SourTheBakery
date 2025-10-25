-- Insert newsletter subscribers
-- This will insert all the email addresses, skipping any that already exist

INSERT INTO public.newsletter_subscribers (email, is_active, subscribed_at)
VALUES
  ('dkammerdeiner@gmail.com', true, NOW()),
  ('mimamcarthur@gmail.com', true, NOW()),
  ('daniellabengtson@gmail.com', true, NOW()),
  ('nandaf09@yahoo.com', true, NOW()),
  ('bigdealsplus@att.net', true, NOW()),
  ('edbarb20@comcast.net', true, NOW()),
  ('neeceemae@sbcglobal.net', true, NOW()),
  ('dlmartins1@hotmail.com', true, NOW()),
  ('sexysassyca@aol.com', true, NOW()),
  ('chabelifonseca26@gmail.com', true, NOW()),
  ('lebronriverak@gmail.com', true, NOW()),
  ('donnagalluzzo@yahoo.com', true, NOW()),
  ('marilynpitman2@gmail.com', true, NOW()),
  ('mjborcynski@aol.com', true, NOW()),
  ('fliip04@yahoo.com', true, NOW()),
  ('mukonsally@gmail.com', true, NOW()),
  ('mattosgood7@gmail.com', true, NOW()),
  ('joe.buonannata@gmail.com', true, NOW()),
  ('rhrh127@aol.com', true, NOW()),
  ('lizhuntington47@gmail.com', true, NOW()),
  ('k2putt@gmail.com', true, NOW()),
  ('felicec41@gmail.com', true, NOW()),
  ('mmennellla@icloud.com', true, NOW()),
  ('billiter.sarah@gmail.com', true, NOW()),
  ('sunflwrlk@hotmail.com', true, NOW()),
  ('kathy_osgood@yahoo.com', true, NOW()),
  ('donnalonski731@gmail.com', true, NOW()),
  ('chichiti1@hotmail.com', true, NOW())
ON CONFLICT (email) DO NOTHING;
