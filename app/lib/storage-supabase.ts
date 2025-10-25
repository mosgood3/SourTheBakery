import { supabase } from './supabase';

// Upload an image file to Supabase Storage
export const uploadImage = async (file: File, folder: string = 'products'): Promise<string> => {
  try {
    // Create a unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `${folder}/${fileName}`;

    // Upload the file to the 'images' bucket
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    throw new Error('Failed to upload image');
  }
};

// Delete an image from Supabase Storage
export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract the file path from the URL
    // Supabase URLs format: https://{project}.supabase.co/storage/v1/object/public/images/{path}
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/images/');
    const filePath = pathParts[1];

    if (!filePath) {
      throw new Error('Invalid image URL - could not extract path');
    }

    // Delete the file from the 'images' bucket
    const { error } = await supabase.storage
      .from('images')
      .remove([filePath]);

    if (error) throw error;

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
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  return validTypes.includes(file.type);
};

// Validate file size (max 5MB)
export const isValidFileSize = (file: File, maxSizeMB: number = 5): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// Gallery-specific functions

// Get all gallery images from Supabase Storage
export const getGalleryImages = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase.storage
      .from('images')
      .list('gallery', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) throw error;

    if (!data) return [];

    // Get public URLs for all files
    const urls = data.map((file) => {
      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(`gallery/${file.name}`);
      return publicUrlData.publicUrl;
    });

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
    await deleteImage(imageUrl);
  } catch (error) {
    // Alternative approach: try to extract filename and construct path manually
    try {
      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Try direct path construction
      const alternativePath = `gallery/${fileName}`;

      const { error: deleteError } = await supabase.storage
        .from('images')
        .remove([alternativePath]);

      if (deleteError) throw deleteError;

    } catch (altError) {
      throw error; // Throw the original error
    }
  }
};

// Generic file upload function (supports any file type including PDFs)
export const uploadFile = async (file: File, folder: string = 'files'): Promise<string> => {
  try {
    // Create a unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `${folder}/${fileName}`;

    // Upload the file to the 'files' bucket
    const { data, error } = await supabase.storage
      .from('files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('files')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    throw new Error('Failed to upload file');
  }
};

// Delete any file from Supabase Storage (generic function)
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    // Extract the file path from the URL
    // Supabase URLs format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const url = new URL(fileUrl);

    // Determine bucket from URL
    let bucket = 'files';
    let filePath = '';

    if (url.pathname.includes('/images/')) {
      bucket = 'images';
      const pathParts = url.pathname.split('/images/');
      filePath = pathParts[1];
    } else if (url.pathname.includes('/files/')) {
      bucket = 'files';
      const pathParts = url.pathname.split('/files/');
      filePath = pathParts[1];
    }

    if (!filePath) {
      throw new Error('Invalid file URL - could not extract path');
    }

    // Delete the file from the appropriate bucket
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;

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
