// Server-side product and order functions using Supabase Service Role
import { supabaseServer } from './supabase-server';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: string;
}

export interface OrderData {
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  status: 'open' | 'completed' | 'cancelled';
  orderDate?: string;
  pickupDate?: string;
}

export interface PendingOrderData {
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  pickupInfo: {
    date: string;
    timeStart: string;
    timeEnd: string;
    location: string;
  };
}

// Check if a product has reached its weekly cap (server-side)
export const checkWeeklyCapServer = async (
  productId: string,
  requestedQuantity: number
): Promise<{ available: boolean; currentSold: number; cap: number; remaining: number }> => {
  try {
    const { data: product, error } = await supabaseServer
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) throw error;
    if (!product) throw new Error('Product not found');

    const weeklyCap = product.weekly_cap || 0;
    const weeklyAmountRemaining = product.weekly_amount_remaining ?? weeklyCap;

    if (weeklyCap === 0) {
      return { available: true, currentSold: 0, cap: 0, remaining: 0 };
    }

    const available = requestedQuantity <= weeklyAmountRemaining;
    const currentSold = weeklyCap - weeklyAmountRemaining;

    return { available, currentSold, cap: weeklyCap, remaining: weeklyAmountRemaining };
  } catch (error) {
    console.error('Error checking weekly cap (server):', error);
    throw error;
  }
};

// Create a new order (server-side) with atomic inventory updates
export const createOrderServer = async (order: Omit<OrderData, 'orderDate'>): Promise<string> => {
  // Track successfully decremented items for rollback in case of failure
  const decrementedItems: Array<{ productId: string; quantity: number; productName: string }> = [];

  try {
    // Phase 1: Atomically decrement inventory for all items
    // Uses database-level row locking to prevent race conditions
    for (const item of order.items) {
      try {
        console.log('Atomically decrementing inventory (server):', {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity
        });

        // Call the atomic RPC function that uses FOR UPDATE locking
        const { data, error } = await supabaseServer.rpc('decrement_inventory', {
          product_id: item.productId,
          quantity_requested: item.quantity
        });

        if (error) {
          console.error('RPC error for item:', item.productName, error);
          throw new Error(`Failed to update inventory for ${item.productName}: ${error.message}`);
        }

        // Check if the decrement was successful
        if (!data || data.length === 0) {
          throw new Error(`No response from inventory system for ${item.productName}`);
        }

        const result = data[0];
        if (!result.success) {
          // Insufficient stock or other error
          throw new Error(result.error_message || `${item.productName} is out of stock`);
        }

        // Track this item for potential rollback
        decrementedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          productName: item.productName
        });

        console.log('Successfully decremented inventory for:', item.productName, 'Remaining:', result.remaining);
      } catch (itemError) {
        console.error('Error processing item (server):', item, 'Error:', itemError);
        // Rollback all previously decremented items
        await rollbackInventory(decrementedItems);
        throw itemError;
      }
    }

    // Phase 2: Create the order document
    // Inventory has been decremented, now create the order
    const { data, error } = await supabaseServer
      .from('orders')
      .insert([
        {
          customer_name: order.customerName,
          customer_email: order.customerEmail,
          items: order.items,
          total: order.total,
          status: order.status,
          order_date: new Date().toISOString(),
          pickup_date: order.pickupDate
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating order document:', error);
      // Rollback inventory since order creation failed
      await rollbackInventory(decrementedItems);
      throw new Error(`Order creation failed: ${error.message}`);
    }

    console.log('Order created successfully (server):', data.id);
    return data.id;
  } catch (error) {
    console.error('Error creating order (server):', error);
    // Ensure rollback happens even for unexpected errors
    if (decrementedItems.length > 0) {
      await rollbackInventory(decrementedItems);
    }
    throw error;
  }
};

// Helper function to rollback inventory for failed orders
async function rollbackInventory(
  items: Array<{ productId: string; quantity: number; productName: string }>
): Promise<void> {
  if (items.length === 0) return;

  console.log('Rolling back inventory for', items.length, 'items');

  for (const item of items) {
    try {
      const { error } = await supabaseServer.rpc('rollback_inventory', {
        product_id: item.productId,
        quantity_to_restore: item.quantity
      });

      if (error) {
        console.error('Failed to rollback inventory for:', item.productName, error);
        // Log critical error but don't throw - we want to attempt all rollbacks
      } else {
        console.log('Successfully rolled back inventory for:', item.productName);
      }
    } catch (rollbackError) {
      console.error('Exception during rollback for:', item.productName, rollbackError);
    }
  }
}

// Create a pending order before payment (to avoid Stripe metadata limits)
export const createPendingOrder = async (pendingOrder: PendingOrderData): Promise<string> => {
  try {
    const { data, error } = await supabaseServer
      .from('pending_orders')
      .insert([
        {
          customer_name: pendingOrder.customerName,
          customer_email: pendingOrder.customerEmail,
          items: pendingOrder.items,
          pickup_info: pendingOrder.pickupInfo,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating pending order:', error);
      throw new Error(`Failed to create pending order: ${error.message}`);
    }

    console.log('Pending order created successfully:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error creating pending order:', error);
    throw error;
  }
};

// Retrieve a pending order by ID
export const getPendingOrder = async (pendingOrderId: string): Promise<PendingOrderData | null> => {
  try {
    const { data, error } = await supabaseServer
      .from('pending_orders')
      .select('*')
      .eq('id', pendingOrderId)
      .single();

    if (error) {
      console.error('Error retrieving pending order:', error);
      throw new Error(`Failed to retrieve pending order: ${error.message}`);
    }

    if (!data) return null;

    return {
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      items: data.items,
      pickupInfo: data.pickup_info
    };
  } catch (error) {
    console.error('Error retrieving pending order:', error);
    throw error;
  }
};

// Delete a pending order after successful payment processing
export const deletePendingOrder = async (pendingOrderId: string): Promise<void> => {
  try {
    const { error } = await supabaseServer
      .from('pending_orders')
      .delete()
      .eq('id', pendingOrderId);

    if (error) {
      console.error('Error deleting pending order:', error);
      // Don't throw - this is cleanup, not critical
    }
  } catch (error) {
    console.error('Error deleting pending order:', error);
    // Don't throw - this is cleanup, not critical
  }
};
