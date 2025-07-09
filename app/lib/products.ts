import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { deleteImage } from './storage';

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: string;
  image: string; // Now stores Firebase Storage URL
  weeklyCap?: number; // Maximum number of items that can be sold per week
  weeklyAmountRemaining?: number; // Current amount remaining for this week
  createdAt?: any;
  updatedAt?: any;
}

export interface Order {
  id?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt?: any;
  updatedAt?: any;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: string;
}

// Check if orders are currently available (Monday 6am to Thursday 5pm)
export const isOrderWindowOpen = (): boolean => {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute; // Convert to minutes

  // Monday 6am (06:00) = 360 minutes
  // Thursday 5pm (17:00) = 1020 minutes

  if (currentDay === 1) { // Monday
    return currentTime >= 360; // After 6am
  } else if (currentDay >= 2 && currentDay <= 3) { // Tuesday to Wednesday
    return true; // All day
  } else if (currentDay === 4) { // Thursday
    return currentTime < 1020; // Before 5pm
  } else { // Friday, Saturday, and Sunday
    return false;
  }
};

// Get the current week's start date (Sunday)
export const getCurrentWeekStart = (): Date => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToSubtract = dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysToSubtract);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

// Get the current week's end date (Saturday)
export const getCurrentWeekEnd = (): Date => {
  const weekStart = getCurrentWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
};

// Check if a product has reached its weekly cap
export const checkWeeklyCap = async (productId: string, requestedQuantity: number): Promise<{ available: boolean; currentSold: number; cap: number; remaining: number }> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    // Get the product to check its weekly cap
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDocs(query(collection(db, 'products'), where('__name__', '==', productId)));
    
    if (productSnap.empty) {
      throw new Error('Product not found');
    }

    const product = productSnap.docs[0].data() as Product;
    const weeklyCap = product.weeklyCap || 0;
    const weeklyAmountRemaining = product.weeklyAmountRemaining ?? weeklyCap;

    if (weeklyCap === 0) {
      return { available: true, currentSold: 0, cap: 0, remaining: 0 }; // No cap set
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
export const getProducts = async (): Promise<Product[]> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      } as Product);
    });
    
    return products;
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

// Add a new product
export const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    // Initialize weeklyAmountRemaining to weeklyCap if not provided
    const productData = {
      ...product,
      weeklyAmountRemaining: product.weeklyAmountRemaining ?? product.weeklyCap ?? 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'products'), productData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

// Update a product
export const updateProduct = async (id: string, product: Partial<Product>): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, {
      ...product,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Delete a product and its associated image
export const deleteProduct = async (id: string, imageUrl?: string): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
    
    // Delete the associated image from Firebase Storage if it exists
    if (imageUrl && imageUrl.startsWith('https://')) {
      try {
        await deleteImage(imageUrl);
      } catch (imageError) {
        console.warn('Failed to delete image:', imageError);
        // Don't throw error here as the product was already deleted
      }
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Create a new order
export const createOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    // Check if order window is open
    if (!isOrderWindowOpen()) {
      throw new Error('Orders are not available at this time. Order window is Monday 6am to Thursday 5pm.');
    }

    // Check weekly caps for all items and update remaining amounts
    for (const item of order.items) {
      const capCheck = await checkWeeklyCap(item.productId, item.quantity);
      if (!capCheck.available) {
        throw new Error(`${item.productName} has reached its weekly limit. Only ${capCheck.remaining} available this week.`);
      }
      
      // Update the product's weeklyAmountRemaining
      const productRef = doc(db, 'products', item.productId);
      await updateDoc(productRef, {
        weeklyAmountRemaining: capCheck.remaining - item.quantity,
        updatedAt: serverTimestamp()
      });
    }

    const docRef = await addDoc(collection(db, 'orders'), {
      ...order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Get all orders
export const getOrders = async (): Promise<Order[]> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      } as Order);
    });
    
    return orders;
  } catch (error) {
    console.error('Error getting orders:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (id: string, status: Order['status']): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const orderRef = doc(db, 'orders', id);
    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Reset weekly amounts for all products (admin function)
export const resetWeeklyAmounts = async (): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const productsQuery = query(collection(db, 'products'));
    const productsSnap = await getDocs(productsQuery);
    
    const updatePromises = productsSnap.docs.map((docSnapshot) => {
      const product = docSnapshot.data() as Product;
      const productRef = doc(db!, 'products', docSnapshot.id);
      return updateDoc(productRef, {
        weeklyAmountRemaining: product.weeklyCap || 0,
        updatedAt: serverTimestamp()
      });
    });

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error resetting weekly amounts:', error);
    throw error;
  }
};

// Update product's weekly amount remaining (admin function)
export const updateProductWeeklyAmount = async (productId: string, weeklyAmountRemaining: number): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      weeklyAmountRemaining,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating product weekly amount:', error);
    throw error;
  }
}; 