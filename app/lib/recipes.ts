import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { deleteFile } from './storage';

export interface Recipe {
  id?: string;
  name: string;
  description: string;
  price: string;
  image: string; // Firebase Storage URL for recipe image
  pdfUrl: string; // Firebase Storage URL for recipe PDF
  createdAt?: any;
  updatedAt?: any;
}

export interface RecipePurchase {
  id?: string;
  recipeName: string;
  recipeId: string;
  customerName: string;
  customerEmail: string;
  price: string;
  purchaseDate?: any;
  downloadUrl: string; // PDF URL for the recipe
}

// Get all recipes
export const getRecipes = async (): Promise<Recipe[]> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const recipes: Recipe[] = [];

    querySnapshot.forEach((doc) => {
      recipes.push({
        id: doc.id,
        ...doc.data()
      } as Recipe);
    });

    return recipes;
  } catch (error) {
    console.error('Error getting recipes:', error);
    throw error;
  }
};

// Get a single recipe by ID
export const getRecipe = async (id: string): Promise<Recipe | null> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const recipeRef = doc(db, 'recipes', id);
    const recipeSnapshot = await getDoc(recipeRef);

    if (!recipeSnapshot.exists()) {
      return null;
    }

    return {
      id: recipeSnapshot.id,
      ...recipeSnapshot.data()
    } as Recipe;
  } catch (error) {
    console.error('Error getting recipe:', error);
    throw error;
  }
};

// Add a new recipe
export const addRecipe = async (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const recipeData = {
      ...recipe,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'recipes'), recipeData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding recipe:', error);
    throw error;
  }
};

// Update a recipe
export const updateRecipe = async (id: string, recipe: Partial<Recipe>): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const recipeRef = doc(db, 'recipes', id);
    await updateDoc(recipeRef, {
      ...recipe,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    throw error;
  }
};

// Delete a recipe and its associated files
export const deleteRecipe = async (id: string, imageUrl?: string, pdfUrl?: string): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const recipeRef = doc(db, 'recipes', id);
    await deleteDoc(recipeRef);

    // Delete the associated image from Firebase Storage if it exists
    if (imageUrl && imageUrl.startsWith('https://')) {
      try {
        await deleteFile(imageUrl);
      } catch (imageError) {
        console.warn('Failed to delete image:', imageError);
      }
    }

    // Delete the associated PDF from Firebase Storage if it exists
    if (pdfUrl && pdfUrl.startsWith('https://')) {
      try {
        await deleteFile(pdfUrl);
      } catch (pdfError) {
        console.warn('Failed to delete PDF:', pdfError);
      }
    }
  } catch (error) {
    console.error('Error deleting recipe:', error);
    throw error;
  }
};

// Create a recipe purchase record
export const createRecipePurchase = async (purchase: Omit<RecipePurchase, 'id' | 'purchaseDate'>): Promise<string> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const docRef = await addDoc(collection(db, 'recipePurchases'), {
      ...purchase,
      purchaseDate: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating recipe purchase:', error);
    throw error;
  }
};

// Get all recipe purchases
export const getRecipePurchases = async (): Promise<RecipePurchase[]> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const q = query(collection(db, 'recipePurchases'), orderBy('purchaseDate', 'desc'));
    const querySnapshot = await getDocs(q);
    const purchases: RecipePurchase[] = [];

    querySnapshot.forEach((doc) => {
      purchases.push({
        id: doc.id,
        ...doc.data()
      } as RecipePurchase);
    });

    return purchases;
  } catch (error) {
    console.error('Error getting recipe purchases:', error);
    throw error;
  }
};
