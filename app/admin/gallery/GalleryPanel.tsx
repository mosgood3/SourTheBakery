'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  getGalleryImages, 
  uploadGalleryImage, 
  deleteGalleryImage,
  isValidImageFile,
  isValidFileSize 
} from '../../lib/storage';
import { FaPlus, FaTrash, FaUpload } from 'react-icons/fa';

export default function GalleryPanel() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const imageUrls = await getGalleryImages();
      setImages(imageUrls);
    } catch (err) {
      console.error('Error fetching images:', err);
      setError('Failed to load gallery images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
    setError(null);
    setSuccess(null);
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError('Please select at least one image to upload');
      return;
    }

    // Check if uploading would exceed 10 image limit
    const totalAfterUpload = images.length + selectedFiles.length;
    if (totalAfterUpload > 10) {
      setError(`Cannot upload ${selectedFiles.length} images. You can have a maximum of 10 gallery images. Currently have ${images.length}, so you can only upload ${10 - images.length} more.`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        if (!isValidImageFile(file)) {
          throw new Error(`${file.name} is not a valid image file`);
        }
        if (!isValidFileSize(file)) {
          throw new Error(`${file.name} is too large (max 5MB)`);
        }
        return uploadGalleryImage(file);
      });

      await Promise.all(uploadPromises);
      setSuccess(`Successfully uploaded ${selectedFiles.length} image(s)`);
      setSelectedFiles(null);
      
      // Reset file input
      const fileInput = document.getElementById('gallery-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Refresh the gallery
      await fetchImages();
    } catch (err) {
      console.error('Error uploading images:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    try {
      setDeleting(true);
      setError(null);
      setSuccess(null);
      
      console.log('Starting delete process for:', imageUrl);
      
      // Try to delete the image
      await deleteGalleryImage(imageUrl);
      
      console.log('Delete successful, refreshing gallery...');
      setSuccess('Image deleted successfully');
      
      // Refresh the gallery immediately
      await fetchImages();
    } catch (err) {
      console.error('Delete failed with error:', err);
      
      // More detailed error handling
      if (err instanceof Error) {
        if (err.message.includes('storage/object-not-found')) {
          setError('Image not found. It may have already been deleted.');
          await fetchImages(); // Refresh to sync
        } else if (err.message.includes('storage/unauthorized')) {
          setError('You do not have permission to delete this image. Make sure you are logged in as admin.');
        } else {
          setError(`Delete failed: ${err.message}`);
        }
      } else {
        setError('Failed to delete image');
      }
    } finally {
      setDeleting(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4">Loading gallery...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gallery Management</h1>
        <p className="text-gray-600">
          Manage your bakery gallery images. Maximum 10 images allowed.
        </p>
        <div className="mt-2">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
            images.length >= 10 
              ? 'bg-red-100 text-red-800' 
              : images.length >= 8 
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
          }`}>
            {images.length}/10 images used
          </span>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload New Images</h2>
        
        <div className="space-y-4">
          <div>
            <input
              id="gallery-file-input"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Accepted formats: JPEG, JPG, PNG, WebP. Max size: 5MB per image.
            </p>
          </div>

          {selectedFiles && selectedFiles.length > 0 && (
            <div className="text-sm text-gray-600">
              {selectedFiles.length} file(s) selected
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFiles || uploading || images.length >= 10}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold ${
              !selectedFiles || uploading || images.length >= 10
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : images.length >= 10 ? (
              <>
                <FaUpload />
                Gallery Full (10/10)
              </>
            ) : (
              <>
                <FaUpload />
                Upload Images
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      {(error || success) && (
        <div className="mb-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex justify-between items-center">
              <span>{error}</span>
              <button onClick={clearMessages} className="text-red-500 hover:text-red-700">×</button>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex justify-between items-center">
              <span>{success}</span>
              <button onClick={clearMessages} className="text-green-500 hover:text-green-700">×</button>
            </div>
          )}
        </div>
      )}

      {/* Gallery Grid */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Current Gallery ({images.length}/10 images)</h2>
          {images.length === 10 && (
            <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              Gallery at maximum capacity
            </div>
          )}
        </div>

        {images.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FaPlus className="mx-auto text-4xl mb-4 opacity-50" />
            <p>No images in gallery yet</p>
            <p className="text-sm">Upload some images to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((imageUrl, index) => (
              <div key={imageUrl} className="relative group">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={imageUrl}
                    alt={`Gallery image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  {/* Display order indicator */}
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    #{index + 1}
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(imageUrl)}
                    disabled={deleting}
                    className={`absolute top-2 right-2 text-white p-2 rounded-full transition-all ${
                      deleting 
                        ? 'bg-gray-500 opacity-50 cursor-not-allowed' 
                        : 'bg-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-700'
                    }`}
                    title={deleting ? "Deleting..." : "Delete image"}
                  >
                    {deleting ? (
                      <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" />
                    ) : (
                      <FaTrash className="text-xs" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}