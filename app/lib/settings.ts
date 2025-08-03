import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface Settings {
  ordersEnabled: boolean; // Master toggle for all orders
  orderWindowStart: string; // Format: "HH:MM"
  orderWindowEnd: string; // Format: "HH:MM"
  orderWindowDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  pickupDate: string; // Format: "YYYY-MM-DD"
  pickupTime: string; // Format: "HH:MM"
  pickupLocation: string;
  createdAt?: any;
  updatedAt?: any;
}

const SETTINGS_DOC_ID = 'store_settings';

// Get store settings
export const getSettings = async (): Promise<Settings> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      return settingsSnap.data() as Settings;
    } else {
      // Return default settings if none exist
      const defaultSettings: Settings = {
        ordersEnabled: true, // Orders enabled by default
        orderWindowStart: '06:00',
        orderWindowEnd: '17:00',
        orderWindowDays: [1, 2, 3, 4], // Monday to Thursday
        pickupDate: new Date().toISOString().split('T')[0],
        pickupTime: '09:00',
        pickupLocation: 'Sour The Bakery - 123 Main St'
      };
      
      // Save default settings
      await setDoc(settingsRef, {
        ...defaultSettings,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return defaultSettings;
    }
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
};

// Update store settings
export const updateSettings = async (settings: Settings): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
    await setDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

// Check if orders are currently available based on settings
export const isOrderWindowOpen = async (): Promise<boolean> => {
  try {
    const settings = await getSettings();
    console.log('Order window check - Settings:', settings);
    
    // First check if orders are globally enabled
    if (!settings.ordersEnabled) {
      console.log('Orders globally disabled');
      return false;
    }
    console.log('Orders globally enabled ✓');
    
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    console.log('Current day:', currentDay, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDay]);
    console.log('Allowed days:', settings.orderWindowDays);
    
    // Check if current day is in the order window days
    if (!settings.orderWindowDays.includes(currentDay)) {
      console.log('Current day not in allowed days');
      return false;
    }
    console.log('Current day is allowed ✓');
    
    // Check if current time is within the order window
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes
    
    // Parse start and end times
    const [startHour, startMinute] = settings.orderWindowStart.split(':').map(Number);
    const [endHour, endMinute] = settings.orderWindowEnd.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    console.log('Time check:', {
      currentTime: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} (${currentTime} minutes)`,
      startTime: `${startHour}:${startMinute.toString().padStart(2, '0')} (${startTime} minutes)`,
      endTime: `${endHour}:${endMinute.toString().padStart(2, '0')} (${endTime} minutes)`,
      withinWindow: currentTime >= startTime && currentTime <= endTime
    });
    
    // Check if current time is within the window
    const isWithinTime = currentTime >= startTime && currentTime <= endTime;
    console.log('Order window result:', isWithinTime);
    
    return isWithinTime;
  } catch (error) {
    console.error('Error checking order window:', error);
    return false; // Default to closed if there's an error
  }
};

// Get pickup information
export const getPickupInfo = async (): Promise<{ date: string; time: string; location: string }> => {
  try {
    const settings = await getSettings();
    return {
      date: settings.pickupDate,
      time: settings.pickupTime,
      location: settings.pickupLocation
    };
  } catch (error) {
    console.error('Error getting pickup info:', error);
    return {
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      location: 'Sour The Bakery'
    };
  }
};

// Check if order deadline has passed
export const isOrderDeadlinePassed = async (): Promise<boolean> => {
  try {
    const settings = await getSettings();
    const now = new Date();
    
    // Calculate deadline time (default to 24 hours before pickup)
    const pickupDateTime = new Date(`${settings.pickupDate}T${settings.pickupTime}`);
    const deadlineTime = new Date(pickupDateTime.getTime() - (24 * 60 * 60 * 1000)); // 24 hours before pickup
    
    return now >= deadlineTime;
  } catch (error) {
    console.error('Error checking order deadline:', error);
    return true; // Default to deadline passed if there's an error
  }
};

// Get maximum orders per week
export const getMaxOrdersPerWeek = async (): Promise<number> => {
  try {
    const settings = await getSettings();
    // The maxOrdersPerWeek field was removed from Settings, so this function will likely need to be removed or refactored.
    // For now, returning a default value, but this might need adjustment.
    return 50; // Default value
  } catch (error) {
    console.error('Error getting max orders per week:', error);
    return 50; // Default value
  }
}; 