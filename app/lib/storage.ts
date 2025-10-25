import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  StorageReference,
  listAll,
  ListResult 
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
      throw new Error('Invalid image URL - could not extract path');
    }

    // Create a reference to the file
    const storageRef = ref(storage, path);

    // Delete the file
    await deleteObject(storageRef);

  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
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

// Gallery-specific functions

// Get all gallery images from Firebase Storage
export const getGalleryImages = async (): Promise<string[]> => {
  try {
    if (!storage) {
      throw new Error('Storage service not available');
    }

    const galleryRef = ref(storage, 'gallery');
    const result: ListResult = await listAll(galleryRef);
    
    const urls = await Promise.all(
      result.items.map(async (itemRef) => {
        return await getDownloadURL(itemRef);
      })
    );
    
    return urls;
  } catch (error) {
    return [];
  }
};

// Upload gallery image
export const uploadGalleryImage = async (file: File): Promise<string> => {
  return uploadImage(file, 'gallery');
};

// Delete gallery image by URL
export const deleteGalleryImage = async (imageUrl: string): Promise<void> => {
  try {
    // First try the standard approach
    await deleteImage(imageUrl);
  } catch (error) {
    // Alternative approach: try to extract filename and construct path manually
    try {
      if (!storage) {
        throw new Error('Storage service not available');
      }

      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const fileNameWithParams = urlParts[urlParts.length - 1];
      const fileName = fileNameWithParams.split('?')[0];

      // Try direct path construction
      const alternativePath = `gallery/${fileName}`;

      const storageRef = ref(storage, alternativePath);
      await deleteObject(storageRef);

    } catch (altError) {
      throw error; // Throw the original error
    }
  }
};

// Generic file upload function (supports any file type)
export const uploadFile = async (file: File, folder: string = 'files'): Promise<string> => {
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
    throw new Error('Failed to upload file');
  }
};

// Delete any file from Firebase Storage (generic function)
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    if (!storage) {
      throw new Error('Storage service not available');
    }

    // Extract the file path from the URL
    const url = new URL(fileUrl);
    const path = decodeURIComponent(url.pathname.split('/o/')[1]?.split('?')[0] || '');

    if (!path) {
      throw new Error('Invalid file URL - could not extract path');
    }

    // Create a reference to the file
    const storageRef = ref(storage, path);

    // Delete the file
    await deleteObject(storageRef);

  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete file');
  }
};

// Validate PDF file type
export const isValidPDFFile = (file: File): boolean => {
  return file.type === 'application/pdf';
}; 