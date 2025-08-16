// Server-side newsletter functions (for API routes)
import { adminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface NewsletterSubscriber {
  id?: string;
  email: string;
  subscribedAt?: any;
  isActive?: boolean;
}

export interface OrderCustomer {
  id?: string;
  email: string;
  name: string;
  orderId?: string;
}

// Get all active newsletter subscribers (server-side)
export const getNewsletterSubscribers = async (): Promise<NewsletterSubscriber[]> => {
  try {
    if (!adminDb) {
      throw new Error('Database service not available');
    }

    const querySnapshot = await adminDb
      .collection('newsletter_subscribers')
      .where('isActive', '==', true)
      .get();
    
    const subscribers: NewsletterSubscriber[] = [];
    
    querySnapshot.forEach((doc) => {
      subscribers.push({
        id: doc.id,
        ...doc.data()
      } as NewsletterSubscriber);
    });
    
    // Sort by subscribedAt client-side to avoid index requirement
    return subscribers.sort((a, b) => {
      if (!a.subscribedAt || !b.subscribedAt) return 0;
      const aTime = a.subscribedAt.toDate ? a.subscribedAt.toDate() : new Date(a.subscribedAt);
      const bTime = b.subscribedAt.toDate ? b.subscribedAt.toDate() : new Date(b.subscribedAt);
      return bTime.getTime() - aTime.getTime(); // Descending order
    });
  } catch (error) {
    console.error('Error getting newsletter subscribers:', error);
    throw error;
  }
};

// Get all customers with open orders (server-side)
export const getOpenOrderCustomers = async (): Promise<OrderCustomer[]> => {
  try {
    if (!adminDb) {
      throw new Error('Database service not available');
    }

    const querySnapshot = await adminDb
      .collection('orders')
      .where('status', '==', 'open')
      .get();
    
    const customers: OrderCustomer[] = [];
    const emailMap = new Map<string, OrderCustomer>(); // To deduplicate by email
    
    querySnapshot.forEach((doc) => {
      const order = doc.data();
      const email = order.customerEmail?.toLowerCase();
      
      if (email && !emailMap.has(email)) {
        emailMap.set(email, {
          id: doc.id,
          email: email,
          name: order.customerName || 'Customer',
          orderId: doc.id
        });
      }
    });
    
    // Convert map to array and sort by name
    return Array.from(emailMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  } catch (error) {
    console.error('Error getting open order customers:', error);
    throw error;
  }
};

// Export admin serverTimestamp
export { FieldValue };