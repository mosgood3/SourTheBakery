-- Migration: Fix Inventory Functions
-- Run this in Supabase SQL Editor to enable inventory decrementing on orders

-- ============================================================================
-- DECREMENT PICKUP INVENTORY (ATOMIC)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.decrement_pickup_inventory(
  p_pickup_id UUID,
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS TABLE(success BOOLEAN, remaining INTEGER, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_remaining INTEGER;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT quantity_remaining INTO v_current_remaining
  FROM public.pickup_products
  WHERE pickup_id = p_pickup_id AND product_id = p_product_id
  FOR UPDATE;

  -- Check if record exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Product not found in this pickup'::TEXT;
    RETURN;
  END IF;

  -- Check if enough stock available
  IF v_current_remaining < p_quantity THEN
    RETURN QUERY SELECT false, v_current_remaining, 'Insufficient stock available'::TEXT;
    RETURN;
  END IF;

  -- Decrement inventory
  UPDATE public.pickup_products
  SET
    quantity_remaining = quantity_remaining - p_quantity,
    updated_at = NOW()
  WHERE pickup_id = p_pickup_id AND product_id = p_product_id;

  -- Return success with new remaining count
  RETURN QUERY SELECT true, (v_current_remaining - p_quantity), NULL::TEXT;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.decrement_pickup_inventory TO authenticated, service_role;

-- ============================================================================
-- ROLLBACK PICKUP INVENTORY
-- ============================================================================
CREATE OR REPLACE FUNCTION public.rollback_pickup_inventory(
  p_pickup_id UUID,
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.pickup_products
  SET
    quantity_remaining = quantity_remaining + p_quantity,
    updated_at = NOW()
  WHERE pickup_id = p_pickup_id AND product_id = p_product_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.rollback_pickup_inventory TO authenticated, service_role;

-- ============================================================================
-- CHECK PICKUP INVENTORY AVAILABILITY (NON-LOCKING)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_pickup_inventory_availability(
  p_pickup_id UUID,
  p_product_id UUID,
  p_quantity_requested INTEGER
)
RETURNS TABLE(available BOOLEAN, remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  SELECT quantity_remaining INTO v_remaining
  FROM public.pickup_products
  WHERE pickup_id = p_pickup_id AND product_id = p_product_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  RETURN QUERY SELECT (v_remaining >= p_quantity_requested), v_remaining;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_pickup_inventory_availability TO authenticated, anon, service_role;

-- ============================================================================
-- DONE
-- ============================================================================
