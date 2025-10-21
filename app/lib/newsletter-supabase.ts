import { supabase } from './supabase';

export interface NewsletterSubscriber {
  id?: string;
  email: string;
  subscribed_at?: string;
  is_active?: boolean;
}

export interface NewsletterEmail {
  id?: string;
  subject: string;
  content: string;
  sent_at?: string;
  sent_by: string;
  recipient_count: number;
}

// Subscribe an email to the newsletter
export const subscribeToNewsletter = async (email: string): Promise<string> => {
  try {
    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      throw new Error('Email already subscribed to newsletter');
    }

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert([{
        email: email.toLowerCase(),
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    throw error;
  }
};

// Get all active newsletter subscribers
export const getNewsletterSubscribers = async (): Promise<NewsletterSubscriber[]> => {
  try {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('is_active', true)
      .order('subscribed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting newsletter subscribers:', error);
    throw error;
  }
};

// Unsubscribe an email from the newsletter
export const unsubscribeFromNewsletter = async (subscriberId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('id', subscriberId);

    if (error) throw error;
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    throw error;
  }
};

// Send newsletter email using API route
export const sendNewsletterEmail = async (
  subject: string,
  content: string,
  sentBy: string,
  recipientType: 'newsletter' | 'orders' = 'newsletter'
): Promise<string> => {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('Admin authentication required');
    }

    // Call the API route to send emails with authentication
    const response = await fetch('/api/newsletter/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        subject,
        content,
        sentBy,
        recipientType
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send newsletter');
    }

    // Note: If you want to save email history, you'll need to create a newsletter_emails table
    // For now, just return a success indicator
    return 'success';
  } catch (error) {
    console.error('Error sending newsletter email:', error);
    throw error;
  }
};

// Get newsletter email history
export const getNewsletterHistory = async (): Promise<NewsletterEmail[]> => {
  // Note: This would require a newsletter_emails table in Supabase
  // For now, return empty array
  return [];
};
