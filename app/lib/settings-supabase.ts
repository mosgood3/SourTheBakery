import { supabase } from './supabase';

export interface Settings {
  ordersEnabled: boolean;
  orderWindowStart: string;
  orderWindowEnd: string;
  orderWindowDays: number[];
  pickupDate: string;
  pickupTimeStart: string;
  pickupTimeEnd: string;
  pickupLocation: string;
  createdAt?: string;
  updatedAt?: string;
}

const SETTINGS_KEY = 'store_settings';

// Get store settings
export const getSettings = async (): Promise<Settings> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', SETTINGS_KEY)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    if (data) {
      return data.value as Settings;
    } else {
      // Return default settings if none exist
      const defaultSettings: Settings = {
        ordersEnabled: true,
        orderWindowStart: '06:00',
        orderWindowEnd: '17:00',
        orderWindowDays: [1, 2, 3, 4], // Monday to Thursday
        pickupDate: new Date().toISOString().split('T')[0],
        pickupTimeStart: '09:00',
        pickupTimeEnd: '12:00',
        pickupLocation: 'Sour The Bakery - 123 Main St'
      };

      // Save default settings
      await supabase
        .from('settings')
        .insert([{
          key: SETTINGS_KEY,
          value: defaultSettings
        }]);

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
    const { error } = await supabase
      .from('settings')
      .upsert({
        key: SETTINGS_KEY,
        value: settings
      }, {
        onConflict: 'key'
      });

    if (error) throw error;
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
    const currentDay = now.getDay();
    console.log('Current day:', currentDay, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDay]);
    console.log('Allowed days:', settings.orderWindowDays);

    // Check if current day is in the order window days
    if (!settings.orderWindowDays.includes(currentDay)) {
      console.log('Current day not in allowed days');
      return false;
    }
    console.log('Current day is allowed ✓');

    // Check if current time is within the order window
    const currentTime = now.getHours() * 60 + now.getMinutes();

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
    return false;
  }
};

// Get pickup information
export const getPickupInfo = async (): Promise<{ date: string; timeStart: string; timeEnd: string; location: string }> => {
  try {
    const settings = await getSettings();
    return {
      date: settings.pickupDate,
      timeStart: settings.pickupTimeStart,
      timeEnd: settings.pickupTimeEnd,
      location: settings.pickupLocation
    };
  } catch (error) {
    console.error('Error getting pickup info:', error);
    return {
      date: new Date().toISOString().split('T')[0],
      timeStart: '09:00',
      timeEnd: '12:00',
      location: 'Sour The Bakery'
    };
  }
};

// Check if order deadline has passed
export const isOrderDeadlinePassed = async (): Promise<boolean> => {
  try {
    const settings = await getSettings();
    const now = new Date();

    // Calculate deadline time (default to 24 hours before pickup start)
    const pickupDateTime = new Date(`${settings.pickupDate}T${settings.pickupTimeStart}`);
    const deadlineTime = new Date(pickupDateTime.getTime() - (24 * 60 * 60 * 1000));

    return now >= deadlineTime;
  } catch (error) {
    console.error('Error checking order deadline:', error);
    return true;
  }
};

// Get maximum orders per week
export const getMaxOrdersPerWeek = async (): Promise<number> => {
  try {
    return 50; // Default value
  } catch (error) {
    console.error('Error getting max orders per week:', error);
    return 50;
  }
};
