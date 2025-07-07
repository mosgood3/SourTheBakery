import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  StorageReference 
} from 'firebase/storage';
import { storage } from './firebase';

// Upload an image file to Firebase Storage
export const uploadImage = async (file: File, folder: string = 'products'): Promise<string> => {
  try {
    if (!storage) {
      throw new Error('Storage service not available');
    }

    // Create a unique filename
    const timestamp = Date.now();
    const fileName = `${folder}/${timestamp}_${file.name}`;
    
    // Create a reference to the file location
    const storageRef = ref(storage, fileName);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};

// Delete an image from Firebase Storage
export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    if (!storage) {
      throw new Error('Storage service not available');
    }

    // Extract the file path from the URL
    const url = new URL(imageUrl);
    const path = decodeURIComponent(url.pathname.split('/o/')[1]?.split('?')[0] || '');
    
    if (!path) {
      throw new Error('Invalid image URL');
    }
    
    // Create a reference to the file
    const storageRef = ref(storage, path);
    
    // Delete the file
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
};

// Get file extension from filename
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

// Validate file type
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
};

// Validate file size (max 5MB)
export const isValidFileSize = (file: File, maxSizeMB: number = 5): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}; 