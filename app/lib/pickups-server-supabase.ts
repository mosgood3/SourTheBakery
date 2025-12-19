// Server-side pickup and order functions using Supabase Service Role
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
  paymentIntentId?: string;
}

export interface PendingOrderData {
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  pickupId: string; // NEW: Required for pickup-specific orders
  pickupInfo: {
    date: string;
    timeStart: string;
    timeEnd: string;
    location: string;
  };
}

// ============================================================================
// PICKUP-SPECIFIC ORDER CREATION
// ============================================================================

/**
 * Create a new order associated with a pickup event (server-side)
 * Uses atomic inventory updates with row-level locking
 */
export const createOrderWithPickup = async (
  order: Omit<OrderData, 'orderDate'>,
  pickupId: string
): Promise<string> => {
  // Track successfully decremented items for rollback in case of failure
  const decrementedItems: Array<{ productId: string; quantity: number; productName: string }> = [];

  try {
    // Phase 1: Atomically decrement inventory for all items
    // Uses database-level row locking to prevent race conditions
    for (const item of order.items) {
      try {
        console.log('Atomically decrementing pickup inventory (server):', {
          pickupId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity
        });

        // Call the atomic RPC function that uses FOR UPDATE locking
        const { data, error } = await supabaseServer.rpc('decrement_pickup_inventory', {
          p_pickup_id: pickupId,
          p_product_id: item.productId,
          p_quantity: item.quantity
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

        console.log('Successfully decremented pickup inventory for:', item.productName, 'Remaining:', result.remaining);
      } catch (itemError) {
        console.error('Error processing item (server):', item, 'Error:', itemError);
        // Rollback all previously decremented items
        await rollbackPickupInventory(decrementedItems, pickupId);
        throw itemError;
      }
    }

    // Phase 2: Create the order document with pickup_id
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
          pickup_date: order.pickupDate,
          pickup_id: pickupId,
          payment_intent_id: order.paymentIntentId
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating order document:', error);
      // Rollback inventory since order creation failed
      await rollbackPickupInventory(decrementedItems, pickupId);
      throw new Error(`Order creation failed: ${error.message}`);
    }

    console.log('Order created successfully with pickup_id (server):', data.id);
    return data.id;
  } catch (error) {
    console.error('Error creating order with pickup (server):', error);
    // Ensure rollback happens even for unexpected errors
    if (decrementedItems.length > 0) {
      await rollbackPickupInventory(decrementedItems, pickupId);
    }
    throw error;
  }
};

// ============================================================================
// INVENTORY ROLLBACK HELPER
// ============================================================================

/**
 * Helper function to rollback pickup inventory for failed orders
 */
async function rollbackPickupInventory(
  items: Array<{ productId: string; quantity: number; productName: string }>,
  pickupId: string
): Promise<void> {
  if (items.length === 0) return;

  console.log('Rolling back pickup inventory for', items.length, 'items in pickup', pickupId);

  for (const item of items) {
    try {
      const { error } = await supabaseServer.rpc('rollback_pickup_inventory', {
        p_pickup_id: pickupId,
        p_product_id: item.productId,
        p_quantity: item.quantity
      });

      if (error) {
        console.error('Failed to rollback pickup inventory for:', item.productName, error);
        // Log critical error but don't throw - we want to attempt all rollbacks
      } else {
        console.log('Successfully rolled back pickup inventory for:', item.productName);
      }
    } catch (rollbackError) {
      console.error('Exception during rollback for:', item.productName, rollbackError);
    }
  }
}

// ============================================================================
// PENDING ORDER OPERATIONS (WITH PICKUP SUPPORT)
// ============================================================================

/**
 * Create a pending order before payment (to avoid Stripe metadata limits)
 * Now includes pickup_id
 */
export const createPendingOrder = async (pendingOrder: PendingOrderData): Promise<string> => {
  try {
    const { data, error } = await supabaseServer
      .from('pending_orders')
      .insert([
        {
          customer_name: pendingOrder.customerName,
          customer_email: pendingOrder.customerEmail,
          items: pendingOrder.items,
          pickup_id: pendingOrder.pickupId, // NEW: Store pickup_id
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

    console.log('Pending order created successfully with pickup_id:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error creating pending order:', error);
    throw error;
  }
};

/**
 * Retrieve a pending order by ID
 * Now returns pickup_id
 */
export const getPendingOrder = async (pendingOrderId: string): Promise<PendingOrderData | null> => {
  try {
    const { data, error } = await supabaseServer
      .from('pending_orders')
      .select('*')
      .eq('id', pendingOrderId)
      .maybeSingle();

    if (error) {
      console.error('Error retrieving pending order:', error);
      throw new Error(`Failed to retrieve pending order: ${error.message}`);
    }

    if (!data) return null;

    return {
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      items: data.items,
      pickupId: data.pickup_id, // NEW: Return pickup_id
      pickupInfo: data.pickup_info
    };
  } catch (error) {
    console.error('Error retrieving pending order:', error);
    throw error;
  }
};

/**
 * Delete a pending order after successful payment processing
 */
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

/**
 * Cleanup old pending orders (older than specified minutes)
 * Call this periodically to prevent orphaned pending orders
 */
export const cleanupOldPendingOrders = async (olderThanMinutes: number = 30): Promise<number> => {
  try {
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000).toISOString();

    const { data, error } = await supabaseServer
      .from('pending_orders')
      .delete()
      .lt('created_at', cutoffTime)
      .select('id');

    if (error) {
      console.error('Error cleaning up old pending orders:', error);
      return 0;
    }

    const deletedCount = data?.length || 0;
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} old pending orders (older than ${olderThanMinutes} minutes)`);
    }
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old pending orders:', error);
    return 0;
  }
};

// ============================================================================
// WEBHOOK IDEMPOTENCY
// ============================================================================

/**
 * Check if a webhook event has already been processed
 * Returns true if already processed (should skip), false if new
 */
export const isWebhookEventProcessed = async (eventId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabaseServer
      .from('processed_webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .maybeSingle();

    if (error) {
      console.error('Error checking webhook event:', error);
      // On error, assume not processed to avoid missing events
      return false;
    }

    return data !== null;
  } catch (error) {
    console.error('Error checking webhook event:', error);
    return false;
  }
};

/**
 * Mark a webhook event as processed
 */
export const markWebhookEventProcessed = async (eventId: string, eventType: string): Promise<void> => {
  try {
    const { error } = await supabaseServer
      .from('processed_webhook_events')
      .insert([{
        event_id: eventId,
        event_type: eventType,
        processed_at: new Date().toISOString()
      }]);

    if (error) {
      // Unique constraint violation means it was already processed (race condition)
      if (error.code === '23505') {
        console.log('Webhook event already marked as processed (race condition handled):', eventId);
        return;
      }
      console.error('Error marking webhook event as processed:', error);
    }
  } catch (error) {
    console.error('Error marking webhook event as processed:', error);
  }
};

/**
 * Cleanup old processed webhook events (older than specified days)
 * Keep the table from growing indefinitely
 */
export const cleanupOldWebhookEvents = async (olderThanDays: number = 7): Promise<number> => {
  try {
    const cutoffTime = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseServer
      .from('processed_webhook_events')
      .delete()
      .lt('processed_at', cutoffTime)
      .select('id');

    if (error) {
      console.error('Error cleaning up old webhook events:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error cleaning up old webhook events:', error);
    return 0;
  }
};

// ============================================================================
// ORDER LOOKUP BY PAYMENT INTENT
// ============================================================================

/**
 * Get an order by its payment intent ID (for idempotency check)
 * Returns the order if found, null otherwise
 */
export const getOrderByPaymentIntent = async (paymentIntentId: string): Promise<any | null> => {
  try {
    const { data, error } = await supabaseServer
      .from('orders')
      .select('id')
      .eq('payment_intent_id', paymentIntentId)
      .maybeSingle();

    if (error) {
      console.error('Error checking order by payment intent:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error checking order by payment intent:', error);
    return null;
  }
};
