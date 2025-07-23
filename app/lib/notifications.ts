import { 
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface NotificationSettings {
  id?: string;
  message: string;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

const NOTIFICATION_DOC_ID = 'main-notification';
const MAX_MESSAGE_LENGTH = 200;

// Get current notification settings
export const getNotificationSettings = async (): Promise<NotificationSettings | null> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const docRef = doc(db, 'settings', 'notifications');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as NotificationSettings;
    }

    return null;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    throw error;
  }
};

// Update notification settings
export const updateNotificationSettings = async (settings: Omit<NotificationSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    // Validate message length
    if (settings.message.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`);
    }

    const docRef = doc(db, 'settings', 'notifications');
    const docSnap = await getDoc(docRef);

    const notificationData = {
      ...settings,
      updatedAt: serverTimestamp(),
      ...(docSnap.exists() ? {} : { createdAt: serverTimestamp() })
    };

    await setDoc(docRef, notificationData, { merge: true });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
};

export { MAX_MESSAGE_LENGTH };