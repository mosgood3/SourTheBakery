-- Migration: Migrate legacy data to pickup system
-- This migration creates a "Legacy Collection" pickup and migrates all existing data
-- Run this AFTER the pickups system has been created (002_create_pickups_system.sql)

-- Step 1: Create "Legacy Collection" pickup from current settings
-- Using a fixed UUID so we can reference it consistently
DO $$
DECLARE
  legacy_pickup_id UUID := '00000000-0000-0000-0000-000000000001';
  settings_data JSONB;
  pickup_date DATE;
  pickup_time_start TIME;
  pickup_time_end TIME;
  pickup_location TEXT;
  order_start TIMESTAMP;
  order_end TIMESTAMP;
BEGIN
  -- Get current settings
  SELECT value INTO settings_data
  FROM settings
  WHERE key = 'store_settings'
  LIMIT 1;

  -- Extract pickup information from settings
  IF settings_data IS NOT NULL THEN
    pickup_date := COALESCE((settings_data->>'pickupDate')::DATE, CURRENT_DATE + INTERVAL '7 days');
    pickup_time_start := COALESCE((settings_data->>'pickupTimeStart')::TIME, '09:00:00');
    pickup_time_end := COALESCE((settings_data->>'pickupTimeEnd')::TIME, '12:00:00');
    pickup_location := COALESCE(settings_data->>'pickupLocation', 'Legacy Location');
  ELSE
    -- Default values if no settings exist
    pickup_date := CURRENT_DATE + INTERVAL '7 days';
    pickup_time_start := '09:00:00';
    pickup_time_end := '12:00:00';
    pickup_location := 'Legacy Location';
  END IF;

  -- Create order window that has already closed (30 days ago to 29 days ago)
  order_start := (CURRENT_DATE - INTERVAL '30 days')::TIMESTAMP;
  order_end := (CURRENT_DATE - INTERVAL '29 days')::TIMESTAMP;

  -- Insert the legacy pickup (inactive)
  INSERT INTO pickups (
    id,
    order_window_start,
    order_window_end,
    pickup_date,
    pickup_time_start,
    pickup_time_end,
    pickup_location,
    is_active
  ) VALUES (
    legacy_pickup_id,
    order_start,
    order_end,
    pickup_date,
    pickup_time_start,
    pickup_time_end,
    pickup_location,
    false -- Inactive
  )
  ON CONFLICT (id) DO NOTHING; -- In case migration is run multiple times

END $$;

-- Step 2: Migrate all active products to the legacy pickup
-- This preserves the current inventory state
INSERT INTO pickup_products (
  pickup_id,
  product_id,
  quantity_cap,
  quantity_remaining,
  price,
  display_order
)
SELECT
  '00000000-0000-0000-0000-000000000001'::UUID,
  id,
  COALESCE(weekly_cap, 0),
  COALESCE(weekly_amount_remaining, 0),
  price,
  0
FROM products
WHERE archived = false
ON CONFLICT (pickup_id, product_id) DO NOTHING; -- In case migration is run multiple times

-- Step 3: Link all existing orders to the legacy pickup
-- This ensures all historical orders remain queryable
UPDATE orders
SET pickup_id = '00000000-0000-0000-0000-000000000001'::UUID
WHERE pickup_id IS NULL;

-- Step 4: Make pickup_id required going forward
-- Now that all existing orders have a pickup_id, make it NOT NULL
ALTER TABLE orders ALTER COLUMN pickup_id SET NOT NULL;

-- Step 5: Create index on orders.pickup_id for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_pickup_id ON orders(pickup_id);

-- Step 6: Add comment to the legacy pickup for documentation
COMMENT ON TABLE pickups IS 'Pickup events for organizing product collections with independent inventory';
COMMENT ON TABLE pickup_products IS 'Junction table linking products to pickups with pickup-specific inventory';
