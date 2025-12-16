-- Migration: Create Pickups System
-- Description: Transforms single-pickup system into multi-pickup event platform
-- Author: Claude Code
-- Date: 2025-01-16

-- ============================================================================
-- 1. CREATE PICKUPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_window_start DATE NOT NULL,
  order_window_end DATE NOT NULL,
  pickup_date DATE NOT NULL,
  pickup_time_start TIME NOT NULL,
  pickup_time_end TIME NOT NULL,
  pickup_location TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_pickups_is_active ON public.pickups(is_active);
CREATE INDEX IF NOT EXISTS idx_pickups_order_window ON public.pickups(order_window_start, order_window_end);
CREATE INDEX IF NOT EXISTS idx_pickups_pickup_date ON public.pickups(pickup_date);

-- ============================================================================
-- 2. CREATE PICKUP_PRODUCTS JOIN TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pickup_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_id UUID NOT NULL REFERENCES public.pickups(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_cap INTEGER NOT NULL CHECK (quantity_cap >= 0),
  quantity_remaining INTEGER NOT NULL CHECK (quantity_remaining >= 0),
  price TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pickup_id, product_id)
);

-- Add indexes for foreign keys and common queries
CREATE INDEX IF NOT EXISTS idx_pickup_products_pickup_id ON public.pickup_products(pickup_id);
CREATE INDEX IF NOT EXISTS idx_pickup_products_product_id ON public.pickup_products(product_id);
CREATE INDEX IF NOT EXISTS idx_pickup_products_inventory ON public.pickup_products(pickup_id, quantity_remaining);

-- ============================================================================
-- 3. ADD PICKUP_ID TO ORDERS TABLE
-- ============================================================================
-- Add pickup_id column (nullable initially for migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'orders'
    AND column_name = 'pickup_id'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN pickup_id UUID REFERENCES public.pickups(id);
    CREATE INDEX IF NOT EXISTS idx_orders_pickup_id ON public.orders(pickup_id);
  END IF;
END $$;

-- ============================================================================
-- 4. ADD PICKUP_ID TO PENDING_ORDERS TABLE
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'pending_orders'
    AND column_name = 'pickup_id'
  ) THEN
    ALTER TABLE public.pending_orders ADD COLUMN pickup_id UUID;
    CREATE INDEX IF NOT EXISTS idx_pending_orders_pickup_id ON public.pending_orders(pickup_id);
  END IF;
END $$;

-- ============================================================================
-- 5. CREATE RPC FUNCTION: DECREMENT PICKUP INVENTORY (ATOMIC)
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

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.decrement_pickup_inventory TO authenticated, service_role;

-- ============================================================================
-- 6. CREATE RPC FUNCTION: ROLLBACK PICKUP INVENTORY
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
  -- Restore inventory by adding quantity back
  UPDATE public.pickup_products
  SET
    quantity_remaining = quantity_remaining + p_quantity,
    updated_at = NOW()
  WHERE pickup_id = p_pickup_id AND product_id = p_product_id;
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.rollback_pickup_inventory TO authenticated, service_role;

-- ============================================================================
-- 7. CREATE RPC FUNCTION: CHECK PICKUP INVENTORY AVAILABILITY (NON-LOCKING)
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
  -- Get current remaining quantity (non-locking read)
  SELECT quantity_remaining INTO v_remaining
  FROM public.pickup_products
  WHERE pickup_id = p_pickup_id AND product_id = p_product_id;

  -- Check if record exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  -- Return availability status
  RETURN QUERY SELECT (v_remaining >= p_quantity_requested), v_remaining;
END;
$$;

-- Grant execute permission to authenticated users, anon, and service role
GRANT EXECUTE ON FUNCTION public.check_pickup_inventory_availability TO authenticated, anon, service_role;

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on pickups table
ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active pickups
CREATE POLICY "Public can view active pickups"
  ON public.pickups FOR SELECT
  TO public
  USING (is_active = true);

-- Policy: Authenticated users can view all pickups (for admin)
CREATE POLICY "Authenticated users can view all pickups"
  ON public.pickups FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert pickups (admin only in practice)
CREATE POLICY "Authenticated users can insert pickups"
  ON public.pickups FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update pickups
CREATE POLICY "Authenticated users can update pickups"
  ON public.pickups FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete pickups
CREATE POLICY "Authenticated users can delete pickups"
  ON public.pickups FOR DELETE
  TO authenticated
  USING (true);

-- Enable RLS on pickup_products table
ALTER TABLE public.pickup_products ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view pickup products (for shopping)
CREATE POLICY "Public can view pickup products"
  ON public.pickup_products FOR SELECT
  TO public
  USING (true);

-- Policy: Authenticated users can insert pickup products
CREATE POLICY "Authenticated users can insert pickup products"
  ON public.pickup_products FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update pickup products
CREATE POLICY "Authenticated users can update pickup products"
  ON public.pickup_products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete pickup products
CREATE POLICY "Authenticated users can delete pickup products"
  ON public.pickup_products FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- 9. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.pickups IS 'Stores pickup events with order windows and pickup details';
COMMENT ON TABLE public.pickup_products IS 'Join table linking products to pickup events with event-specific inventory';
COMMENT ON COLUMN public.orders.pickup_id IS 'References the pickup event this order is for';
COMMENT ON COLUMN public.pending_orders.pickup_id IS 'References the pickup event for pending orders';
COMMENT ON FUNCTION public.decrement_pickup_inventory IS 'Atomically decrements pickup inventory with row-level locking';
COMMENT ON FUNCTION public.rollback_pickup_inventory IS 'Restores pickup inventory if order creation fails';
COMMENT ON FUNCTION public.check_pickup_inventory_availability IS 'Non-locking check for pickup inventory availability';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
