import { supabase } from './supabase';
import { deleteFile } from './storage-supabase';

export interface Recipe {
  id?: string;
  name: string;
  description: string;
  price: string;
  image: string; // Storage URL for recipe image
  pdf_url: string; // Storage URL for recipe PDF
  created_at?: string;
  updated_at?: string;
}

export interface RecipePurchase {
  id?: string;
  recipe_name: string;
  recipe_id: string;
  customer_name: string;
  customer_email: string;
  price: string;
  download_url: string; // PDF URL for the recipe
  purchase_date?: string;
  created_at?: string;
}

// Get all recipes
export const getRecipes = async (): Promise<Recipe[]> => {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    throw error;
  }
};

// Get a single recipe by ID
export const getRecipe = async (id: string): Promise<Recipe | null> => {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Add a new recipe
export const addRecipe = async (recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .insert([{
        name: recipe.name,
        description: recipe.description,
        price: recipe.price,
        image: recipe.image,
        pdf_url: recipe.pdf_url
      }])
      .select()
      .single();

    if (error) throw error;

    return data.id;
  } catch (error) {
    throw error;
  }
};

// Update a recipe
export const updateRecipe = async (id: string, recipe: Partial<Recipe>): Promise<void> => {
  try {
    const updateData: any = {};

    if (recipe.name !== undefined) updateData.name = recipe.name;
    if (recipe.description !== undefined) updateData.description = recipe.description;
    if (recipe.price !== undefined) updateData.price = recipe.price;
    if (recipe.image !== undefined) updateData.image = recipe.image;
    if (recipe.pdf_url !== undefined) updateData.pdf_url = recipe.pdf_url;

    const { error } = await supabase
      .from('recipes')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

// Delete a recipe and its associated files
export const deleteRecipe = async (id: string, imageUrl?: string, pdfUrl?: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Delete the associated image from Storage if it exists
    if (imageUrl && imageUrl.startsWith('https://')) {
      try {
        await deleteFile(imageUrl);
      } catch (imageError) {
      }
    }

    // Delete the associated PDF from Storage if it exists
    if (pdfUrl && pdfUrl.startsWith('https://')) {
      try {
        await deleteFile(pdfUrl);
      } catch (pdfError) {
      }
    }
  } catch (error) {
    throw error;
  }
};

// Create a recipe purchase record (client-side, requires auth)
export const createRecipePurchase = async (purchase: Omit<RecipePurchase, 'id' | 'purchase_date' | 'created_at'>): Promise<string> => {
  try {
    const { data, error } = await supabase
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

// Get all recipe purchases
export const getRecipePurchases = async (): Promise<RecipePurchase[]> => {
  try {
    const { data, error } = await supabase
      .from('recipe_purchases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    throw error;
  }
};
