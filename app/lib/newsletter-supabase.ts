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

export interface NewsletterSend {
  id?: string;
  subscriber_id?: string;
  subscriber_email: string;
  subject: string;
  sent_at?: string;
  status: 'sent' | 'failed' | 'bounced';
  error_message?: string;
  message_id?: string;
}

// Subscribe an email to the newsletter
export const subscribeToNewsletter = async (email: string): Promise<string> => {
  try {
    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

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
    throw error;
  }
};

// Log a newsletter send
export const logNewsletterSend = async (
  subscriberEmail: string,
  subject: string,
  status: 'sent' | 'failed' | 'bounced' = 'sent',
  messageId?: string,
  errorMessage?: string
): Promise<void> => {
  try {
    // Try to get subscriber ID
    const { data: subscriber } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', subscriberEmail.toLowerCase())
      .maybeSingle();

    const { error } = await supabase
      .from('newsletter_sends')
      .insert([{
        subscriber_id: subscriber?.id || null,
        subscriber_email: subscriberEmail.toLowerCase(),
        subject,
        status,
        message_id: messageId,
        error_message: errorMessage
      }]);

    if (error) {
      // Don't throw - we don't want logging failures to break email sending
    }
  } catch (error) {
    // Don't throw - we don't want logging failures to break email sending
  }
};

// Get newsletter send history for a specific subscriber
export const getSubscriberSendHistory = async (subscriberEmail: string): Promise<NewsletterSend[]> => {
  try {
    const { data, error } = await supabase
      .from('newsletter_sends')
      .select('*')
      .eq('subscriber_email', subscriberEmail.toLowerCase())
      .order('sent_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

// Get all newsletter sends
export const getAllNewsletterSends = async (limit: number = 100): Promise<NewsletterSend[]> => {
  try {
    const { data, error } = await supabase
      .from('newsletter_sends')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

// Get newsletter email history
export const getNewsletterHistory = async (): Promise<NewsletterEmail[]> => {
  // Note: This would require a newsletter_emails table in Supabase
  // For now, return empty array
  return [];
};
