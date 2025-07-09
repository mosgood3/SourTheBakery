'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { getProducts, addProduct, updateProduct, deleteProduct, Product } from '../../lib/products';
import { uploadImage, isValidImageFile, isValidFileSize } from '../../lib/storage';
import Image from 'next/image';
import { FiPlus } from 'react-icons/fi';

export default function AdminProducts() {
  const { admin, loading: authLoading } = useAdminAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    weeklyCap: ''
  });

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !admin) {
      router.push('/admin/login');
    }
  }, [admin, authLoading, router]);

  // Fetch products
  useEffect(() => {
    if (admin) {
      fetchProducts();
    }
  }, [admin]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isValidImageFile(file)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size
    if (!isValidFileSize(file, 5)) {
      setError('Image file size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setUploading(true);

      let imageUrl = formData.image;

      // Upload new image if selected
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      const productData = {
        ...formData,
        image: imageUrl,
        weeklyCap: formData.weeklyCap ? parseInt(formData.weeklyCap) : undefined
      };

      if (editingId) {
        await updateProduct(editingId, productData);
        setEditingId(null);
      } else {
        await addProduct(productData);
      }

      // Reset form
      setFormData({ name: '', description: '', price: '', image: '', weeklyCap: '' });
      setSelectedFile(null);
      setImagePreview(null);
      setIsAdding(false);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save product');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id || null);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      weeklyCap: product.weeklyCap?.toString() || ''
    });
    setImagePreview(product.image);
    setSelectedFile(null);
    setIsAdding(true);
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id, imageUrl);
        fetchProducts();
      } catch (err) {
        console.error('Error deleting product:', err);
        setError('Failed to delete product');
      }
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ name: '', description: '', price: '', image: '', weeklyCap: '' });
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-beige flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold"></div>
          <p className="mt-4 text-brown">Loading...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-beige p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-serif font-bold text-brown mb-2">Product Management</h1>
            <p className="text-brown/70">Manage your bakery products</p>
          </div>
          <div className="flex gap-4">
            {/* Removed Back to Dashboard button */}
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-accent-gold text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors duration-300 shadow-md"
              >
                <FiPlus size={18} />
                Add Product
              </button>
            )}
          </div>
        </div>

        {/* Add/Edit Form */}
        {isAdding && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-accent-gold/20 mb-8">
            <h2 className="text-2xl font-serif font-bold text-brown mb-6">
              {editingId ? 'Edit Product' : 'Add New Product'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-brown mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-brown/20 focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all duration-300 bg-white/50"
                    placeholder="Sourdough Bread"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brown mb-2">
                    Price
                  </label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-brown/20 focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all duration-300 bg-white/50"
                    placeholder="$6.50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-brown mb-2">
                    Weekly Cap (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.weeklyCap}
                    onChange={(e) => setFormData({ ...formData, weeklyCap: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-brown/20 focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all duration-300 bg-white/50"
                    placeholder="50"
                    min="0"
                  />
                  <p className="text-sm text-brown/60 mt-1">
                    Maximum number of this item that can be sold per week. Leave empty for no limit.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-brown mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-brown/20 focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all duration-300 bg-white/50 h-24 resize-none"
                  placeholder="Artisanal sourdough bread made with traditional techniques"
                  required
                />
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-semibold text-brown mb-2">
                  Product Image
                </label>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Image preview */}
                {imagePreview && (
                  <div className="mb-4">
                    <div className="relative w-32 h-32 mx-auto">
                      <Image
                        src={imagePreview}
                        alt="Product preview"
                        fill
                        className="object-contain rounded-xl border border-brown/20"
                      />
                    </div>
                    <p className="text-center text-sm text-brown/70 mt-2">
                      {selectedFile ? `Selected: ${selectedFile.name}` : 'Current image'}
                    </p>
                  </div>
                )}

                {/* Upload button */}
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-brown/30 hover:border-accent-gold hover:bg-accent-gold/5 transition-all duration-300 text-brown/70 hover:text-brown"
                >
                  {imagePreview ? 'Change Image' : 'Click to upload image (JPEG, PNG, WebP, max 5MB)'}
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-accent-gold text-brown px-8 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : (editingId ? 'Update Product' : 'Add Product')}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={uploading}
                  className="bg-brown/10 text-brown px-8 py-3 rounded-xl font-semibold hover:bg-brown/20 transition-colors duration-300 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Products List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold"></div>
            <p className="mt-4 text-brown/70">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-accent-gold/20"
              >
                <div className="text-center mb-4">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-contain rounded-xl"
                    />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-brown mb-2">
                    {product.name}
                  </h3>
                  <p className="text-brown/70 text-sm mb-2">
                    {product.description}
                  </p>
                  <p className="text-lg font-semibold text-accent-gold">
                    {product.price}
                  </p>
                  {product.weeklyCap && (
                    <p className="text-sm text-brown/60 mt-1">
                      Weekly Cap: {product.weeklyCap}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 bg-accent-gold text-brown py-2 px-4 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors duration-300 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id!, product.image)}
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-xl font-semibold hover:bg-red-600 transition-colors duration-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-brown/70 text-xl">No products yet.</p>
            <p className="text-brown/50 mt-2">Add your first product to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
} 