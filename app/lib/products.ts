import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { deleteImage } from './storage';

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: string;
  image: string; // Now stores Firebase Storage URL
  createdAt?: any;
  updatedAt?: any;
}

// Get all products
export const getProducts = async (): Promise<Product[]> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      } as Product);
    });
    
    return products;
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

// Add a new product
export const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const docRef = await addDoc(collection(db, 'products'), {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

// Update a product
export const updateProduct = async (id: string, product: Partial<Product>): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, {
      ...product,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Delete a product and its associated image
export const deleteProduct = async (id: string, imageUrl?: string): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Database service not available');
    }

    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
    
    // Delete the associated image from Firebase Storage if it exists
    if (imageUrl && imageUrl.startsWith('https://')) {
      try {
        await deleteImage(imageUrl);
      } catch (imageError) {
        console.warn('Failed to delete image:', imageError);
        // Don't throw error here as the product was already deleted
      }
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}; 