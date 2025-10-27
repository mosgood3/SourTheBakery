-- Migration: Atomic Inventory Management
-- Purpose: Prevent race conditions when multiple users purchase the same product
-- Created: 2025-10-27

-- Function to atomically decrement inventory with proper locking
CREATE OR REPLACE FUNCTION decrement_inventory(
  product_id UUID,
  quantity_requested INT
) RETURNS TABLE (
  success BOOLEAN,
  remaining INT,
  error_message TEXT
) AS $$
DECLARE
  current_remaining INT;
  product_name TEXT;
BEGIN
  -- Lock the row for update to prevent concurrent modifications
  -- This ensures only one transaction can modify this product at a time
  SELECT weekly_amount_remaining, name
  INTO current_remaining, product_name
  FROM products
  WHERE id = product_id
  FOR UPDATE;

  -- Check if product exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'Product not found'::TEXT;
    RETURN;
  END IF;

  -- Check if sufficient stock is available
  IF current_remaining >= quantity_requested THEN
    -- Sufficient stock - decrement inventory
    UPDATE products
    SET weekly_amount_remaining = weekly_amount_remaining - quantity_requested,
        updated_at = NOW()
    WHERE id = product_id;

    RETURN QUERY SELECT TRUE, (current_remaining - quantity_requested)::INT, NULL::TEXT;
  ELSE
    -- Insufficient stock - return error
    RETURN QUERY SELECT
      FALSE,
      current_remaining::INT,
      format('Only %s units of %s available', current_remaining, product_name)::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to rollback inventory (in case of order failure)
CREATE OR REPLACE FUNCTION rollback_inventory(
  product_id UUID,
  quantity_to_restore INT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE products
  SET weekly_amount_remaining = weekly_amount_remaining + quantity_to_restore,
      updated_at = NOW()
  WHERE id = product_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to check inventory without locking (for pre-checkout validation)
CREATE OR REPLACE FUNCTION check_inventory_availability(
  product_id UUID,
  quantity_requested INT
) RETURNS TABLE (
  available BOOLEAN,
  remaining INT
) AS $$
DECLARE
  current_remaining INT;
BEGIN
  SELECT weekly_amount_remaining
  INTO current_remaining
  FROM products
  WHERE id = product_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    (current_remaining >= quantity_requested),
    current_remaining::INT;
END;
$$ LANGUAGE plpgsql;

-- Add index on product id for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_products_id ON products(id);

-- Add index on weekly_amount_remaining for inventory queries
CREATE INDEX IF NOT EXISTS idx_products_inventory ON products(weekly_amount_remaining);

COMMENT ON FUNCTION decrement_inventory IS 'Atomically decrements product inventory with row-level locking to prevent race conditions';
COMMENT ON FUNCTION rollback_inventory IS 'Restores product inventory in case of order processing failure';
COMMENT ON FUNCTION check_inventory_availability IS 'Checks inventory availability without locking for pre-checkout validation';
