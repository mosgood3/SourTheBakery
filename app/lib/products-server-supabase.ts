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

// Create a new order (server-side)
export const createOrderServer = async (order: Omit<OrderData, 'orderDate'>): Promise<string> => {
  try {
    // Check weekly caps for all items and update remaining amounts
    for (const item of order.items) {
      try {
        console.log('Processing item for weekly cap check (server):', {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity
        });

        const capCheck = await checkWeeklyCapServer(item.productId, item.quantity);
        if (!capCheck.available) {
          throw new Error(
            `${item.productName} has reached its weekly limit. Only ${capCheck.remaining} available this week.`
          );
        }

        // Update the product's weekly_amount_remaining
        const { error: updateError } = await supabaseServer
          .from('products')
          .update({ weekly_amount_remaining: capCheck.remaining - item.quantity })
          .eq('id', item.productId);

        if (updateError) throw updateError;

        console.log('Successfully updated inventory for (server):', item.productName);
      } catch (itemError) {
        console.error('Error processing item (server):', item, 'Error:', itemError);
        throw itemError;
      }
    }

    // Create the order document
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

    if (error) throw error;

    console.log('Order created successfully (server):', data.id);
    return data.id;
  } catch (error) {
    console.error('Error creating order (server):', error);
    throw error;
  }
};
