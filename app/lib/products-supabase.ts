import { supabase } from './supabase';
import { deleteImage } from './storage-supabase';
import { isOrderWindowOpen as isOrderWindowOpenFromSettings } from './settings-supabase';

export interface Product {
  id?: string;
  name: string;
  price: string;
  image: string;
  quantity?: string;
  weekly_cap?: number;
  weekly_amount_remaining?: number;
  archived?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id?: string;
  customer_name: string;
  customer_email: string;
  items: OrderItem[];
  total: number;
  status: 'open' | 'completed' | 'cancelled';
  order_date?: string;
  pickup_date?: string;
  pickup_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: string;
}

export interface OrderData {
  customer_name: string;
  customer_email: string;
  items: OrderItem[];
  total: number;
  status: 'open' | 'completed' | 'cancelled';
  order_date?: string;
  pickup_date?: string;
}

// Check if orders are currently available (Monday 6am to Thursday 5pm)
export const isOrderWindowOpen = (): boolean => {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  if (currentDay === 1) {
    return currentTime >= 360;
  } else if (currentDay >= 2 && currentDay <= 3) {
    return true;
  } else if (currentDay === 4) {
    return currentTime < 1020;
  } else {
    return false;
  }
};

// Check if a product has reached its weekly cap
// NOTE: This is a non-locking check used for UX purposes (pre-checkout validation)
// The actual atomic inventory decrement happens in the webhook using the RPC function
// This helps prevent users from adding out-of-stock items to cart, but the webhook
// is the source of truth for inventory availability
export const checkWeeklyCap = async (
  productId: string,
  requestedQuantity: number
): Promise<{ available: boolean; currentSold: number; cap: number; remaining: number }> => {
  try {
    const { data: product, error } = await supabase
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
    console.error('Error checking weekly cap:', error);
    throw error;
  }
};

// Get all products
// By default, only returns active (non-archived) products
// Set includeArchived to true to get all products including archived ones (admin view)
export const getProducts = async (includeArchived: boolean = false): Promise<Product[]> => {
  try {
    let query = supabase
      .from('products')
      .select('*');

    // Filter out archived products unless explicitly requested
    if (!includeArchived) {
      query = query.eq('archived', false);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

// Add a new product
export const addProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  try {
    const productData = {
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: product.quantity,
      weekly_cap: product.weekly_cap ?? 0,
      weekly_amount_remaining: product.weekly_amount_remaining ?? product.weekly_cap ?? 0,
    };

    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

// Update a product
export const updateProduct = async (id: string, product: Partial<Product>): Promise<void> => {
  try {
    const updateData: any = {};

    if (product.name !== undefined) updateData.name = product.name;
    if (product.price !== undefined) updateData.price = product.price;
    if (product.image !== undefined) updateData.image = product.image;
    if (product.quantity !== undefined) updateData.quantity = product.quantity;
    if (product.weekly_cap !== undefined) updateData.weekly_cap = product.weekly_cap;
    if (product.weekly_amount_remaining !== undefined) updateData.weekly_amount_remaining = product.weekly_amount_remaining;

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Delete a product and its associated image
export const deleteProduct = async (id: string, imageUrl?: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (imageUrl && imageUrl.startsWith('https://')) {
      try {
        await deleteImage(imageUrl);
      } catch (imageError) {
        console.warn('Failed to delete image:', imageError);
      }
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Create a new order
export const createOrder = async (order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  try {
    // Check if order window is open using settings
    try {
      const orderWindowOpen = await isOrderWindowOpenFromSettings();
      if (!orderWindowOpen) {
        console.warn('Order window is closed, but allowing webhook order creation');
      }
    } catch (windowError) {
      console.error('Order window check failed:', windowError);
      console.warn('Proceeding with order creation despite window check failure');
    }

    // Check weekly caps for all items and update remaining amounts
    for (const item of order.items) {
      try {
        console.log('Processing item for weekly cap check:', {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity
        });

        const capCheck = await checkWeeklyCap(item.productId, item.quantity);
        if (!capCheck.available) {
          throw new Error(`${item.productName} has reached its weekly limit. Only ${capCheck.remaining} available this week.`);
        }

        // Update the product's weekly_amount_remaining
        const { error: updateError } = await supabase
          .from('products')
          .update({ weekly_amount_remaining: capCheck.remaining - item.quantity })
          .eq('id', item.productId);

        if (updateError) throw updateError;

        console.log('Successfully updated inventory for:', item.productName);
      } catch (itemError) {
        console.error('Error processing item:', item, 'Error:', itemError);
        throw itemError;
      }
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        items: order.items,
        total: order.total,
        status: order.status,
        order_date: order.order_date || new Date().toISOString(),
        pickup_date: order.pickup_date
      }])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Get all orders
export const getOrders = async (): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting orders:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (id: string, status: Order['status']): Promise<void> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Create an admin order (bypasses order window and cap checks)
export const createAdminOrder = async (order: {
  customer_name: string;
  customer_email: string;
  items: OrderItem[];
  total: number;
  pickup_id: string;
  pickup_date: string;
}): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        items: order.items,
        total: order.total,
        status: 'open',
        order_date: new Date().toISOString(),
        pickup_date: order.pickup_date,
        pickup_id: order.pickup_id
      }])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating admin order:', error);
    throw error;
  }
};

// Reset weekly amounts for all products (admin function)
export const resetWeeklyAmounts = async (): Promise<void> => {
  try {
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*');

    if (fetchError) throw fetchError;

    const updatePromises = (products || []).map((product) =>
      supabase
        .from('products')
        .update({ weekly_amount_remaining: product.weekly_cap || 0 })
        .eq('id', product.id)
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error resetting weekly amounts:', error);
    throw error;
  }
};

// Update product's weekly amount remaining (admin function)
export const updateProductWeeklyAmount = async (productId: string, weeklyAmountRemaining: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ weekly_amount_remaining: weeklyAmountRemaining })
      .eq('id', productId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating product weekly amount:', error);
    throw error;
  }
};

// Archive a product (soft delete - hides from public but preserves data)
export const archiveProduct = async (productId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ archived: true })
      .eq('id', productId);

    if (error) throw error;
  } catch (error) {
    console.error('Error archiving product:', error);
    throw error;
  }
};

// Unarchive a product (restore to active status)
export const unarchiveProduct = async (productId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ archived: false })
      .eq('id', productId);

    if (error) throw error;
  } catch (error) {
    console.error('Error unarchiving product:', error);
    throw error;
  }
};
