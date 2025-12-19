// Server-side newsletter functions (for API routes)
import { supabaseServer } from './supabase-server';

export interface NewsletterSubscriber {
  id?: string;
  email: string;
  subscribed_at?: string;
  is_active?: boolean;
}

export interface OrderCustomer {
  id?: string;
  email: string;
  name: string;
  orderId?: string;
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

// Get all active newsletter subscribers (server-side)
export const getNewsletterSubscribers = async (): Promise<NewsletterSubscriber[]> => {
  try {
    const { data, error } = await supabaseServer
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

// Get all customers with open orders (server-side)
export const getOpenOrderCustomers = async (pickupId?: string): Promise<OrderCustomer[]> => {
  try {
    let query = supabaseServer
      .from('orders')
      .select('id, customer_email, customer_name, pickup_id')
      .eq('status', 'open');

    // Apply pickup filter if specified
    if (pickupId && pickupId !== 'all') {
      if (pickupId === 'no-pickup') {
        query = query.is('pickup_id', null);
      } else {
        query = query.eq('pickup_id', pickupId);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    // Deduplicate by email
    const emailMap = new Map<string, OrderCustomer>();

    (data || []).forEach((order) => {
      const email = order.customer_email?.toLowerCase();

      if (email && !emailMap.has(email)) {
        emailMap.set(email, {
          id: order.id,
          email: email,
          name: order.customer_name || 'Customer',
          orderId: order.id
        });
      }
    });

    // Convert map to array and sort by name
    return Array.from(emailMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  } catch (error) {
    throw error;
  }
};

// Log a newsletter send (server-side)
export const logNewsletterSend = async (
  subscriberEmail: string,
  subject: string,
  status: 'sent' | 'failed' | 'bounced' = 'sent',
  messageId?: string,
  errorMessage?: string
): Promise<void> => {
  try {
    // Try to get subscriber ID
    const { data: subscriber } = await supabaseServer
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', subscriberEmail.toLowerCase())
      .maybeSingle();

    const { error } = await supabaseServer
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
