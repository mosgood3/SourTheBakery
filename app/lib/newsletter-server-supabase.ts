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
    console.error('Error getting newsletter subscribers:', error);
    throw error;
  }
};

// Get all customers with open orders (server-side)
export const getOpenOrderCustomers = async (): Promise<OrderCustomer[]> => {
  try {
    const { data, error } = await supabaseServer
      .from('orders')
      .select('id, customer_email, customer_name')
      .eq('status', 'open');

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
    console.error('Error getting open order customers:', error);
    throw error;
  }
};
