import { supabase } from './supabase';

export interface NotificationSettings {
  id?: string;
  message: string;
  isActive: boolean;
  created_at?: string;
  updated_at?: string;
}

const NOTIFICATION_KEY = 'notifications';
const MAX_MESSAGE_LENGTH = 200;

// Get current notification settings
export const getNotificationSettings = async (): Promise<NotificationSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', NOTIFICATION_KEY)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    if (data) {
      return data.value as NotificationSettings;
    }

    return null;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    throw error;
  }
};

// Update notification settings
export const updateNotificationSettings = async (settings: Omit<NotificationSettings, 'id' | 'created_at' | 'updated_at'>): Promise<void> => {
  try {
    // Validate message length
    if (settings.message.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`);
    }

    const { error } = await supabase
      .from('settings')
      .upsert({
        key: NOTIFICATION_KEY,
        value: settings
      }, {
        onConflict: 'key'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
};

export { MAX_MESSAGE_LENGTH };
