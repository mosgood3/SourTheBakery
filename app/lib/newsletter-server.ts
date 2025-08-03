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

// Export other functions that might be needed
export { addDoc, collection, serverTimestamp };