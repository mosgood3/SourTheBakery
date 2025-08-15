// Server-side newsletter functions (for API routes)
import { 
  collection, 
  getDocs,
  addDoc,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from './firebase';

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
    if (!db) {
      throw new Error('Database service not available');
    }

    const q = query(
      collection(db, 'newsletter_subscribers'),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
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
    if (!db) {
      throw new Error('Database service not available');
    }

    const q = query(
      collection(db, 'orders'),
      where('status', '==', 'open')
    );
    const querySnapshot = await getDocs(q);
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

// Export other functions that might be needed
export { addDoc, collection, serverTimestamp };