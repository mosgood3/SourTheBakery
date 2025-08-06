import { 
  collection, 
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db, auth } from './firebase';

export interface NewsletterSubscriber {
  id?: string;
  email: string;
  subscribedAt?: any;
  isActive?: boolean;
}

export interface NewsletterEmail {
  id?: string;
  subject: string;
  content: string;
  sentAt?: any;
  sentBy: string;
  recipientCount: number;
}

// Subscribe an email to the newsletter
export const subscribeToNewsletter = async (email: string): Promise<string> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    // Check if email already exists
    const existingQuery = query(
      collection(db, 'newsletter_subscribers'),
      where('email', '==', email.toLowerCase())
    );
    const existingDocs = await getDocs(existingQuery);
    
    if (!existingDocs.empty) {
      throw new Error('Email already subscribed to newsletter');
    }

    const docRef = await addDoc(collection(db, 'newsletter_subscribers'), {
      email: email.toLowerCase(),
      subscribedAt: serverTimestamp(),
      isActive: true
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    throw error;
  }
};

// Get all active newsletter subscribers
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

// Unsubscribe an email from the newsletter
export const unsubscribeFromNewsletter = async (subscriberId: string): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const subscriberRef = doc(db, 'newsletter_subscribers', subscriberId);
    await deleteDoc(subscriberRef);
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    throw error;
  }
};

// Send newsletter email using API route
export const sendNewsletterEmail = async (
  subject: string, 
  content: string, 
  sentBy: string
): Promise<string> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    if (!auth.currentUser) {
      throw new Error('Admin authentication required');
    }

    // Get authentication token
    const token = await auth.currentUser.getIdToken();

    // Call the API route to send emails with authentication
    const response = await fetch('/api/newsletter/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        subject,
        content,
        sentBy
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send newsletter');
    }

    // Save email record to database
    const emailRef = await addDoc(collection(db, 'newsletter_emails'), {
      subject,
      content,
      sentAt: serverTimestamp(),
      sentBy,
      recipientCount: result.recipientCount
    });

    return emailRef.id;
  } catch (error) {
    console.error('Error sending newsletter email:', error);
    throw error;
  }
};

// Get newsletter email history
export const getNewsletterHistory = async (): Promise<NewsletterEmail[]> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const q = query(
      collection(db, 'newsletter_emails'),
      orderBy('sentAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const emails: NewsletterEmail[] = [];
    
    querySnapshot.forEach((doc) => {
      emails.push({
        id: doc.id,
        ...doc.data()
      } as NewsletterEmail);
    });
    
    return emails;
  } catch (error) {
    console.error('Error getting newsletter history:', error);
    throw error;
  }
};