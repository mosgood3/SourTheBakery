import { supabase } from './supabase';
import { Product } from './products-supabase';

export interface Pickup {
  id?: string;
  order_window_start: string;
  order_window_end: string;
  pickup_date: string;
  pickup_time_start: string;
  pickup_time_end: string;
  pickup_location: string;
  image_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PickupProduct {
  id?: string;
  pickup_id: string;
  product_id: string;
  quantity_cap: number;        // Legacy field - kept in sync with quantity_remaining
  quantity_remaining: number;  // The actual available quantity (decremented by orders)
  price: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
  // Joined product data
  product?: Product;
}

export interface PickupWithProducts extends Pickup {
  products: PickupProduct[];
}

// ============================================================================
// PICKUP CRUD OPERATIONS
// ============================================================================

/**
 * Get all active pickups (where order window is currently open)
 * Active means: is_active = true AND current date is between order_window_start and order_window_end (inclusive, all-day)
 */
export const getActivePickups = async (): Promise<Pickup[]> => {
  try {
    // Get today's date as YYYY-MM-DD (no time component)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('pickups')
      .select('*')
      .eq('is_active', true)
      .lte('order_window_start', todayStr)
      .gte('order_window_end', todayStr)
      .order('pickup_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting active pickups:', error);
    throw error;
  }
};

/**
 * Get all pickups (for admin panel)
 * Returns all pickups regardless of active status or order window
 */
export const getAllPickups = async (): Promise<Pickup[]> => {
  try {
    const { data, error } = await supabase
      .from('pickups')
      .select('*')
      .order('pickup_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting all pickups:', error);
    throw error;
  }
};

/**
 * Get a single pickup by ID
 */
export const getPickup = async (id: string): Promise<Pickup | null> => {
  try {
    const { data, error } = await supabase
      .from('pickups')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error getting pickup:', error);
    throw error;
  }
};

/**
 * Create a new pickup
 * Returns the ID of the created pickup
 */
export const createPickup = async (pickup: Omit<Pickup, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  try {
    // Validate required fields
    if (!pickup.pickup_location || !pickup.pickup_date || !pickup.pickup_time_start || !pickup.pickup_time_end) {
      throw new Error('Location, date, and time are required');
    }

    const { data, error } = await supabase
      .from('pickups')
      .insert([{
        order_window_start: pickup.order_window_start,
        order_window_end: pickup.order_window_end,
        pickup_date: pickup.pickup_date,
        pickup_time_start: pickup.pickup_time_start,
        pickup_time_end: pickup.pickup_time_end,
        pickup_location: pickup.pickup_location,
        image_url: pickup.image_url || null,
        is_active: pickup.is_active ?? true,
      }])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating pickup:', error);
    throw error;
  }
};

/**
 * Update an existing pickup
 */
export const updatePickup = async (id: string, pickup: Partial<Pickup>): Promise<void> => {
  try {
    const updateData: any = {};

    if (pickup.order_window_start !== undefined) updateData.order_window_start = pickup.order_window_start;
    if (pickup.order_window_end !== undefined) updateData.order_window_end = pickup.order_window_end;
    if (pickup.pickup_date !== undefined) updateData.pickup_date = pickup.pickup_date;
    if (pickup.pickup_time_start !== undefined) updateData.pickup_time_start = pickup.pickup_time_start;
    if (pickup.pickup_time_end !== undefined) updateData.pickup_time_end = pickup.pickup_time_end;
    if (pickup.pickup_location !== undefined) updateData.pickup_location = pickup.pickup_location;
    if (pickup.image_url !== undefined) updateData.image_url = pickup.image_url;
    if (pickup.is_active !== undefined) updateData.is_active = pickup.is_active;

    const { error } = await supabase
      .from('pickups')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating pickup:', error);
    throw error;
  }
};

/**
 * Delete a pickup
 * Note: This will cascade delete all pickup_products due to ON DELETE CASCADE
 */
export const deletePickup = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('pickups')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting pickup:', error);
    throw error;
  }
};

// ============================================================================
// PICKUP PRODUCT ASSOCIATION OPERATIONS
// ============================================================================

/**
 * Get all products for a specific pickup (with joined product data)
 */
export const getPickupProducts = async (pickupId: string): Promise<PickupProduct[]> => {
  try {
    const { data, error } = await supabase
      .from('pickup_products')
      .select(`
        *,
        product:products(*)
      `)
      .eq('pickup_id', pickupId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting pickup products:', error);
    throw error;
  }
};

/**
 * Get a single pickup product by pickup_id and product_id
 */
export const getPickupProduct = async (pickupId: string, productId: string): Promise<PickupProduct | null> => {
  try {
    const { data, error } = await supabase
      .from('pickup_products')
      .select(`
        *,
        product:products(*)
      `)
      .eq('pickup_id', pickupId)
      .eq('product_id', productId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error getting pickup product:', error);
    throw error;
  }
};

/**
 * Add a product to a pickup
 */
export const addProductToPickup = async (pickupProduct: Omit<PickupProduct, 'id' | 'created_at' | 'updated_at' | 'product'>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('pickup_products')
      .insert([{
        pickup_id: pickupProduct.pickup_id,
        product_id: pickupProduct.product_id,
        quantity_cap: pickupProduct.quantity_cap,
        quantity_remaining: pickupProduct.quantity_remaining,
        price: pickupProduct.price,
        display_order: pickupProduct.display_order ?? 0,
      }]);

    if (error) throw error;
  } catch (error) {
    console.error('Error adding product to pickup:', error);
    throw error;
  }
};

/**
 * Update a pickup product (quantity, price, etc.)
 */
export const updatePickupProduct = async (id: string, data: Partial<PickupProduct>): Promise<void> => {
  try {
    const updateData: any = {};

    if (data.quantity_cap !== undefined) updateData.quantity_cap = data.quantity_cap;
    if (data.quantity_remaining !== undefined) updateData.quantity_remaining = data.quantity_remaining;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.display_order !== undefined) updateData.display_order = data.display_order;

    const { error } = await supabase
      .from('pickup_products')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating pickup product:', error);
    throw error;
  }
};

/**
 * Remove a product from a pickup
 */
export const removeProductFromPickup = async (pickupId: string, productId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('pickup_products')
      .delete()
      .eq('pickup_id', pickupId)
      .eq('product_id', productId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing product from pickup:', error);
    throw error;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a pickup's order window is currently open
 */
export const isPickupOrderWindowOpen = async (pickupId: string): Promise<boolean> => {
  try {
    const pickup = await getPickup(pickupId);
    if (!pickup || !pickup.is_active) {
      return false;
    }

    // Compare dates only (no time component)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const windowStart = new Date(pickup.order_window_start);
    windowStart.setHours(0, 0, 0, 0);

    const windowEnd = new Date(pickup.order_window_end);
    windowEnd.setHours(23, 59, 59, 999); // Include the entire end date

    return today >= windowStart && today <= windowEnd;
  } catch (error) {
    console.error('Error checking if order window is open:', error);
    return false;
  }
};

/**
 * Get a pickup with all its products (full detail view)
 */
export const getPickupWithProducts = async (pickupId: string): Promise<PickupWithProducts | null> => {
  try {
    const pickup = await getPickup(pickupId);
    if (!pickup) {
      return null;
    }

    const products = await getPickupProducts(pickupId);

    return {
      ...pickup,
      products,
    };
  } catch (error) {
    console.error('Error getting pickup with products:', error);
    throw error;
  }
};

/**
 * Check pickup inventory availability (non-locking check for UI)
 * This is for pre-checkout validation - webhook uses atomic RPC function
 */
export const checkPickupInventory = async (
  pickupId: string,
  productId: string,
  quantityRequested: number
): Promise<{ available: boolean; remaining: number }> => {
  try {
    const { data, error } = await supabase
      .rpc('check_pickup_inventory_availability', {
        p_pickup_id: pickupId,
        p_product_id: productId,
        p_quantity_requested: quantityRequested,
      });

    if (error) throw error;

    if (data && data.length > 0) {
      return {
        available: data[0].available,
        remaining: data[0].remaining,
      };
    }

    return { available: false, remaining: 0 };
  } catch (error) {
    console.error('Error checking pickup inventory:', error);
    return { available: false, remaining: 0 };
  }
};

/**
 * Get remaining stock for a product in a specific pickup
 */
export const getRemainingStock = async (pickupId: string, productId: string): Promise<number> => {
  try {
    const pickupProduct = await getPickupProduct(pickupId, productId);
    return pickupProduct?.quantity_remaining ?? 0;
  } catch (error) {
    console.error('Error getting remaining stock:', error);
    return 0;
  }
};
