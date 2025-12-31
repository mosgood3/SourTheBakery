import { supabase } from './supabase';
import { deleteImage } from './storage-supabase';

export interface AffiliateLink {
  id?: string;
  name: string;
  description: string;
  url: string;
  image: string;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

// Get all affiliate links ordered by sort_order
export const getAffiliateLinks = async (): Promise<AffiliateLink[]> => {
  try {
    const { data, error } = await supabase
      .from('affiliate_links')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting affiliate links:', error);
    throw error;
  }
};

// Add a new affiliate link
export const addAffiliateLink = async (link: Omit<AffiliateLink, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  try {
    // Get the highest sort_order to add new item at the end
    const { data: existing } = await supabase
      .from('affiliate_links')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = existing && existing.length > 0 ? (existing[0].sort_order || 0) + 1 : 0;

    const { data, error } = await supabase
      .from('affiliate_links')
      .insert([{
        name: link.name,
        description: link.description,
        url: link.url,
        image: link.image,
        sort_order: link.sort_order ?? nextSortOrder
      }])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error adding affiliate link:', error);
    throw error;
  }
};

// Update an affiliate link
export const updateAffiliateLink = async (id: string, link: Partial<AffiliateLink>): Promise<void> => {
  try {
    const updateData: Partial<AffiliateLink> = {};

    if (link.name !== undefined) updateData.name = link.name;
    if (link.description !== undefined) updateData.description = link.description;
    if (link.url !== undefined) updateData.url = link.url;
    if (link.image !== undefined) updateData.image = link.image;
    if (link.sort_order !== undefined) updateData.sort_order = link.sort_order;

    const { error } = await supabase
      .from('affiliate_links')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating affiliate link:', error);
    throw error;
  }
};

// Delete an affiliate link and its associated image
export const deleteAffiliateLink = async (id: string, imageUrl?: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('affiliate_links')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Delete the associated image if it exists
    if (imageUrl && imageUrl.startsWith('https://')) {
      try {
        await deleteImage(imageUrl);
      } catch (imageError) {
        console.warn('Failed to delete image:', imageError);
      }
    }
  } catch (error) {
    console.error('Error deleting affiliate link:', error);
    throw error;
  }
};

// Reorder affiliate links
export const reorderAffiliateLinks = async (links: { id: string; sort_order: number }[]): Promise<void> => {
  try {
    const updates = links.map((link) =>
      supabase
        .from('affiliate_links')
        .update({ sort_order: link.sort_order })
        .eq('id', link.id)
    );

    await Promise.all(updates);
  } catch (error) {
    console.error('Error reordering affiliate links:', error);
    throw error;
  }
};
