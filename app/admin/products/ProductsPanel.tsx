import React, { useState, useRef } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct, Product, resetWeeklyAmounts, updateProductWeeklyAmount } from '../../lib/products';
import { uploadImage, isValidImageFile, isValidFileSize } from '../../lib/storage';
import Image from 'next/image';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';

export default function ProductsPanel({ admin }: { admin: any }) {
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
    weeklyCap: '',
    weeklyAmountRemaining: ''
  });
  const [resetting, setResetting] = useState(false);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount if admin
  React.useEffect(() => { if (admin) fetchProducts(); }, [admin]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isValidImageFile(file)) { setError('Please select a valid image file (JPEG, PNG, or WebP)'); return; }
    if (!isValidFileSize(file, 5)) { setError('Image file size must be less than 5MB'); return; }
    setSelectedFile(file); setError(null);
    const reader = new FileReader();
    reader.onload = (e) => { setImagePreview(e.target?.result as string); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null); setUploading(true);
      let imageUrl = formData.image;
      if (selectedFile) { imageUrl = await uploadImage(selectedFile); }
      const productData = {
        ...formData,
        image: imageUrl,
        weeklyCap: formData.weeklyCap ? parseInt(formData.weeklyCap) : undefined,
        weeklyAmountRemaining: formData.weeklyAmountRemaining ? parseInt(formData.weeklyAmountRemaining) : undefined
      };
      if (editingId) { await updateProduct(editingId, productData); setEditingId(null); } else { await addProduct(productData); }
      setFormData({ name: '', description: '', price: '', image: '', weeklyCap: '', weeklyAmountRemaining: '' }); setSelectedFile(null); setImagePreview(null); setIsAdding(false);
      if (fileInputRef.current) { fileInputRef.current.value = ''; }
      fetchProducts();
    } catch (err) { setError('Failed to save product'); } finally { setUploading(false); }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id || null);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      weeklyCap: product.weeklyCap?.toString() || '',
      weeklyAmountRemaining: product.weeklyAmountRemaining?.toString() || ''
    });
    setImagePreview(product.image); setSelectedFile(null); setIsAdding(true);
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try { await deleteProduct(id, imageUrl); fetchProducts(); } catch (err) { setError('Failed to delete product'); }
    }
  };

  const cancelEdit = () => {
    setEditingId(null); setIsAdding(false); setFormData({ name: '', description: '', price: '', image: '', weeklyCap: '', weeklyAmountRemaining: '' }); setSelectedFile(null); setImagePreview(null); if (fileInputRef.current) { fileInputRef.current.value = ''; }
  };

  const triggerFileInput = () => { fileInputRef.current?.click(); };

  // Reset all weekly amounts
  const handleResetWeeklyAmounts = async () => {
    if (!window.confirm('Are you sure you want to reset all weekly amounts to their weekly caps?')) return;
    setResetting(true);
    try {
      await resetWeeklyAmounts();
      fetchProducts();
      alert('Weekly amounts have been reset to their caps.');
    } catch (err) {
      setError('Failed to reset weekly amounts');
    } finally {
      setResetting(false);
    }
  };

  // Update weekly amount remaining for a product
  const handleWeeklyAmountChange = async (productId: string, value: string) => {
    const num = parseInt(value);
    if (isNaN(num) || num < 0) return;
    try {
      await updateProductWeeklyAmount(productId, num);
      fetchProducts();
    } catch (err) {
      setError('Failed to update weekly amount remaining');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-serif font-bold text-brown mb-2">Product Management</h1>
          <p className="text-brown/70">Manage your bakery products</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleResetWeeklyAmounts}
            className="flex items-center gap-2 bg-brown/10 text-brown px-6 py-3 rounded-xl font-semibold hover:bg-brown/20 transition-colors duration-300 shadow-md border border-brown/20 cursor-pointer"
            disabled={resetting}
          >
            <FiRefreshCw size={18} />
            {resetting ? 'Resetting...' : 'Reset Weekly Amounts'}
          </button>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-accent-gold border-1 border-brown text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors duration-300 shadow-md cursor-pointer"
            >
              <FiPlus size={18} />
              Add Product
            </button>
          )}
        </div>
      </div>
      {isAdding && (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-accent-gold/20 mb-8">
          <h2 className="text-2xl font-serif font-bold text-brown mb-6">
            {editingId ? 'Edit Product' : 'Add New Product'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-brown mb-2">Product Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-brown/20 focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all duration-300 bg-white/50" placeholder="Sourdough Bread" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brown mb-2">Price</label>
                <input type="text" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-brown/20 focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all duration-300 bg-white/50" placeholder="$6.50" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-brown mb-2">Weekly Cap (Optional)</label>
                <input type="number" value={formData.weeklyCap} onChange={(e) => setFormData({ ...formData, weeklyCap: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-brown/20 focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all duration-300 bg-white/50" placeholder="20" min={0} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brown mb-2">Weekly Amount Remaining</label>
                <input type="number" value={formData.weeklyAmountRemaining} onChange={(e) => setFormData({ ...formData, weeklyAmountRemaining: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-brown/20 focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all duration-300 bg-white/50" placeholder="20" min={0} />
                <p className="text-xs text-brown/50 mt-1">Set the current amount remaining for this week. Will be set to Weekly Cap when creating new products.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-brown mb-2">Image</label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="w-full px-4 py-2 rounded-xl border border-brown/20 bg-white/50" />
                {imagePreview && <Image src={imagePreview} alt="Preview" width={120} height={120} className="mt-2 rounded-xl border border-brown/20" />}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brown mb-2">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-brown/20 focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all duration-300 bg-white/50" placeholder="Product description..." rows={3} required />
            </div>
            <div className="flex gap-4">
              <button type="submit" className="bg-accent-gold text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors duration-300 shadow-md cursor-pointer" disabled={uploading}>{uploading ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}</button>
              <button type="button" onClick={cancelEdit} className="bg-brown text-white px-6 py-3 rounded-xl font-semibold hover:bg-brown/90 transition-colors duration-300 cursor-pointer">Cancel</button>
            </div>
            {error && <div className="text-red-600 mt-2">{error}</div>}
          </form>
        </div>
      )}
      {/* Product List */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-accent-gold/20">
        <h2 className="text-2xl font-serif font-bold text-brown mb-6">All Products</h2>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold"></div>
            <p className="mt-4 text-brown/70">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-brown/70 text-xl">No products yet.</p>
            <p className="text-brown/50 mt-2">Add your first product to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="bg-cream/80 rounded-2xl p-6 shadow border border-accent-gold/10 flex flex-col">
                <div className="flex-1">
                  <Image src={product.image} alt={product.name} width={200} height={200} className="rounded-xl mb-4 object-cover w-full h-40" />
                  <h3 className="text-xl font-bold text-brown mb-2">{product.name}</h3>
                  <p className="text-brown/70 mb-2">{product.description}</p>
                  <p className="text-lg font-semibold text-accent-gold mb-2">{product.price}</p>
                  {product.weeklyCap && <p className="text-sm text-brown/50 mb-2">Weekly Cap: {product.weeklyCap}</p>}
                  {typeof product.weeklyAmountRemaining === 'number' && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-brown/50">Remaining:</span>
                      {editingId === product.id ? (
                        <input
                          type="number"
                          min={0}
                          value={product.weeklyAmountRemaining}
                          onChange={e => handleWeeklyAmountChange(product.id!, e.target.value)}
                          className="w-20 px-2 py-1 rounded border border-brown/20 text-brown text-sm bg-white/70 focus:border-accent-gold focus:outline-none"
                        />
                      ) : (
                        <span className="text-brown font-semibold text-base">{product.weeklyAmountRemaining}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => handleEdit(product)} className="bg-accent-gold text-brown px-4 py-2 rounded-lg font-semibold hover:bg-accent-gold/90 transition-colors duration-300 border-1 border-brown cursor-pointer">Edit</button>
                  <button onClick={() => handleDelete(product.id!, product.image)} className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors duration-300 cursor-pointer">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 