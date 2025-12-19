-- Migration: Remove name and description from pickups table
-- These fields are unnecessary - pickups are identified by their date/time/location

-- Remove the name column
ALTER TABLE pickups DROP COLUMN IF EXISTS name;

-- Remove the description column
ALTER TABLE pickups DROP COLUMN IF EXISTS description;

-- Update the legacy pickup to remove these fields (if it was already created)
-- Note: This won't fail if the legacy pickup doesn't exist yet
UPDATE pickups
SET updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';
