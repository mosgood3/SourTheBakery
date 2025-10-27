// Server-side recipe functions using Supabase Service Role
// This file should ONLY be imported in API routes and server-side code
import { supabaseServer } from './supabase-server';
import { RecipePurchase } from './recipes-supabase';

// Create a recipe purchase record (server-side, bypasses RLS)
// Use this in API routes and webhooks
export const createRecipePurchaseServer = async (purchase: Omit<RecipePurchase, 'id' | 'purchase_date' | 'created_at'>): Promise<string> => {
  try {
    const { data, error } = await supabaseServer
      .from('recipe_purchases')
      .insert([{
        recipe_name: purchase.recipe_name,
        recipe_id: purchase.recipe_id,
        customer_name: purchase.customer_name,
        customer_email: purchase.customer_email,
        price: purchase.price,
        download_url: purchase.download_url
      }])
      .select()
      .single();

    if (error) throw error;

    return data.id;
  } catch (error) {
    throw error;
  }
};
