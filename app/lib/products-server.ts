// Server-side product and order functions using Firebase Admin SDK
import { adminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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
  orderDate: any;
  pickupDate: any;
}

// Check if a product has reached its weekly cap (server-side)
export const checkWeeklyCapServer = async (productId: string, requestedQuantity: number): Promise<{ available: boolean; currentSold: number; cap: number; remaining: number }> => {
  try {
    // Get the product to check its weekly cap
    const productRef = adminDb.collection('products').doc(productId);
    const productSnapshot = await productRef.get();

    if (!productSnapshot.exists) {
      throw new Error('Product not found');
    }

    const product = productSnapshot.data();
    if (!product) {
      throw new Error('Product data not found');
    }

    const weeklyCap = product.weeklyCap || 0;
    const weeklyAmountRemaining = product.weeklyAmountRemaining ?? weeklyCap;

    if (weeklyCap === 0) {
      return { available: true, currentSold: 0, cap: 0, remaining: 0 }; // No cap set
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
          throw new Error(`${item.productName} has reached its weekly limit. Only ${capCheck.remaining} available this week.`);
        }
        
        // Update the product's weeklyAmountRemaining
        const productRef = adminDb.collection('products').doc(item.productId);
        await productRef.update({
          weeklyAmountRemaining: capCheck.remaining - item.quantity,
          updatedAt: FieldValue.serverTimestamp()
        });
        
        console.log('Successfully updated inventory for (server):', item.productName);
      } catch (itemError) {
        console.error('Error processing item (server):', item, 'Error:', itemError);
        throw itemError;
      }
    }

    // Create the order document
    const orderData = {
      ...order,
      orderDate: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    const docRef = await adminDb.collection('orders').add(orderData);
    console.log('Order created successfully (server):', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating order (server):', error);
    throw error;
  }
};