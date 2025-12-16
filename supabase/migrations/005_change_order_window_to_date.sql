-- Migration: Change order window columns from TIMESTAMP to DATE
-- Description: Order windows should be all-day (no specific times)
-- This migration handles existing databases where 002 was already run with TIMESTAMP

-- ============================================================================
-- ALTER ORDER WINDOW COLUMNS TO DATE TYPE
-- ============================================================================

-- Drop and recreate the index if it exists
DROP INDEX IF EXISTS public.idx_pickups_order_window;

-- Alter order_window_start to DATE (converts existing TIMESTAMP to DATE)
DO $$
BEGIN
  -- Check current column type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'pickups'
    AND column_name = 'order_window_start'
    AND data_type != 'date'
  ) THEN
    -- Convert TIMESTAMP to DATE
    ALTER TABLE public.pickups
    ALTER COLUMN order_window_start TYPE DATE
    USING order_window_start::DATE;
  END IF;
END $$;

-- Alter order_window_end to DATE (converts existing TIMESTAMP to DATE)
DO $$
BEGIN
  -- Check current column type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'pickups'
    AND column_name = 'order_window_end'
    AND data_type != 'date'
  ) THEN
    -- Convert TIMESTAMP to DATE
    ALTER TABLE public.pickups
    ALTER COLUMN order_window_end TYPE DATE
    USING order_window_end::DATE;
  END IF;
END $$;

-- Recreate the index
CREATE INDEX IF NOT EXISTS idx_pickups_order_window ON public.pickups(order_window_start, order_window_end);

-- Add comment for documentation
COMMENT ON COLUMN public.pickups.order_window_start IS 'Start date for order window (all day)';
COMMENT ON COLUMN public.pickups.order_window_end IS 'End date for order window (all day)';
