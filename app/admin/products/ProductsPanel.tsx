import React, { useState, useRef } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct, Product, resetWeeklyAmounts, updateProductWeeklyAmount } from '../../lib/products-supabase';
import { uploadImage, isValidImageFile, isValidFileSize } from '../../lib/storage-supabase';
import Image from 'next/image';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';

export default function ProductsPanel({ admin }: { admin: any }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Input limits
  const MAX_TITLE_WORDS = 4;
  
  // Validation functions
  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };
  
  const validateTitle = (title: string): boolean => {
    return getWordCount(title) <= MAX_TITLE_WORDS;
  };
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    image: '',
    quantity: '',
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
      setError(null);
      
      // Validate title word count
      if (!validateTitle(formData.name)) {
        setError(`Product name must be ${MAX_TITLE_WORDS} words or less`);
        return;
      }
      
      setUploading(true);
      let imageUrl = formData.image;
      if (selectedFile) { imageUrl = await uploadImage(selectedFile); }
      const productData = {
        ...formData,
        image: imageUrl,
        weeklyCap: formData.weeklyCap ? parseInt(formData.weeklyCap) : undefined,
        weeklyAmountRemaining: formData.weeklyAmountRemaining ? parseInt(formData.weeklyAmountRemaining) : undefined
      };
      if (editingId) { 
        await updateProduct(editingId, productData); 
        setEditingId(null); 
      } else { 
        await addProduct(productData); 
        setIsAdding(false);
      }
      setFormData({ name: '', price: '', image: '', quantity: '', weeklyCap: '', weeklyAmountRemaining: '' }); setSelectedFile(null); setImagePreview(null);
      if (fileInputRef.current) { fileInputRef.current.value = ''; }
      fetchProducts();
    } catch (err) { setError('Failed to save product'); } finally { setUploading(false); }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id || null);
    setFormData({
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: product.quantity || '',
      weeklyCap: product.weeklyCap?.toString() || '',
      weeklyAmountRemaining: product.weeklyAmountRemaining?.toString() || ''
    });
    setImagePreview(product.image); setSelectedFile(null);
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try { await deleteProduct(id, imageUrl); fetchProducts(); } catch (err) { setError('Failed to delete product'); }
    }
  };

  const cancelEdit = () => {
    setEditingId(null); setFormData({ name: '', price: '', image: '', quantity: '', weeklyCap: '', weeklyAmountRemaining: '' }); setSelectedFile(null); setImagePreview(null); if (fileInputRef.current) { fileInputRef.current.value = ''; }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-brown mb-2">Product Management</h1>
          <p className="text-brown/70">Manage your bakery products</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={handleResetWeeklyAmounts}
            className="flex items-center justify-center gap-2 bg-brown/10 text-brown px-6 py-3 rounded-xl font-semibold hover:bg-brown/20 transition-colors duration-300 shadow-md border border-brown/20 cursor-pointer"
            disabled={resetting}
          >
            <FiRefreshCw size={18} />
            {resetting ? 'Resetting...' : 'Reset Weekly Amounts'}
          </button>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center justify-center gap-2 bg-accent-gold border-1 border-brown text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors duration-300 shadow-md cursor-pointer"
            >
              <FiPlus size={18} />
              Add Product
            </button>
          )}
        </div>
      </div>
      {isAdding && !editingId && (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-accent-gold/20 mb-8">
          <h2 className="text-2xl font-serif font-bold text-brown mb-6">
            {editingId ? 'Edit Product' : 'Add New Product'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-brown mb-2">Product Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 bg-white/50 focus:outline-none focus:ring-2 focus:ring-accent-gold/20 ${
                    validateTitle(formData.name) 
                      ? 'border-brown/20 focus:border-accent-gold' 
                      : 'border-red-300 focus:border-red-500'
                  }`}
                  placeholder="Sourdough Bread" 
                  required 
                />
                <div className="flex justify-between items-center mt-1">
                  <p className={`text-xs ${validateTitle(formData.name) ? 'text-brown/50' : 'text-red-500'}`}>
                    {getWordCount(formData.name)} / {MAX_TITLE_WORDS} words
                  </p>
                  {!validateTitle(formData.name) && (
                    <p className="text-xs text-red-500">Too many words!</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-brown mb-2">Price</label>
                <input type="text" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-brown/20 focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all duration-300 bg-white/50" placeholder="$6.50" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-brown mb-2">Quantity per Order</label>
                <input type="text" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-brown/20 focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all duration-300 bg-white/50" placeholder="e.g., 6 cookies, 1 loaf, 12 muffins" />
                <p className="text-xs text-brown/50 mt-1">What customers get in each order (optional but recommended)</p>
              </div>
              <div></div>
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
                {imagePreview && imagePreview.trim() && <Image src={imagePreview} alt="Preview" width={120} height={120} className="mt-2 rounded-xl border border-brown/20" />}
              </div>
            </div>
            <div className="flex gap-4">
              <button type="submit" className="bg-accent-gold text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors duration-300 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" disabled={uploading || !validateTitle(formData.name)}>{uploading ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}</button>
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
                {editingId === product.id ? (
                  // Inline Edit Form
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-brown mb-1">Product Name</label>
                      <input 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                        className={`w-full px-3 py-2 rounded-lg border focus:outline-none text-sm bg-white/70 ${
                          validateTitle(formData.name) 
                            ? 'border-brown/20 focus:border-accent-gold' 
                            : 'border-red-300 focus:border-red-500'
                        }`}
                        required 
                      />
                      <p className={`text-xs mt-1 ${validateTitle(formData.name) ? 'text-brown/50' : 'text-red-500'}`}>
                        {getWordCount(formData.name)} / {MAX_TITLE_WORDS} words
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brown mb-1">Price</label>
                      <input 
                        type="text" 
                        value={formData.price} 
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                        className="w-full px-3 py-2 rounded-lg border border-brown/20 focus:border-accent-gold focus:outline-none text-sm bg-white/70" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brown mb-1">Quantity per Order</label>
                      <input 
                        type="text" 
                        value={formData.quantity} 
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} 
                        className="w-full px-3 py-2 rounded-lg border border-brown/20 focus:border-accent-gold focus:outline-none text-sm bg-white/70" 
                        placeholder="e.g., 6 cookies" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-brown mb-1">Weekly Cap</label>
                        <input 
                          type="number" 
                          value={formData.weeklyCap} 
                          onChange={(e) => setFormData({ ...formData, weeklyCap: e.target.value })} 
                          className="w-full px-3 py-2 rounded-lg border border-brown/20 focus:border-accent-gold focus:outline-none text-sm bg-white/70" 
                          min={0} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-brown mb-1">Remaining</label>
                        <input 
                          type="number" 
                          value={formData.weeklyAmountRemaining} 
                          onChange={(e) => setFormData({ ...formData, weeklyAmountRemaining: e.target.value })} 
                          className="w-full px-3 py-2 rounded-lg border border-brown/20 focus:border-accent-gold focus:outline-none text-sm bg-white/70" 
                          min={0} 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brown mb-1">Image</label>
                      <input 
                        ref={fileInputRef} 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileSelect} 
                        className="w-full px-3 py-2 rounded-lg border border-brown/20 bg-white/70 text-sm" 
                      />
                      {imagePreview && imagePreview.trim() && (
                        <Image 
                          src={imagePreview} 
                          alt="Preview" 
                          width={80} 
                          height={80} 
                          className="mt-2 rounded-lg border border-brown/20" 
                        />
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button 
                        type="submit" 
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-300 cursor-pointer text-sm flex-1 disabled:opacity-50 disabled:cursor-not-allowed" 
                        disabled={uploading || !validateTitle(formData.name)}
                      >
                        {uploading ? 'Saving...' : 'Update'}
                      </button>
                      <button 
                        type="button" 
                        onClick={cancelEdit} 
                        className="bg-brown text-white px-4 py-2 rounded-lg font-semibold hover:bg-brown/90 transition-colors duration-300 cursor-pointer text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                    {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
                  </form>
                ) : (
                  // Regular Product Display
                  <>
                    <div className="flex-1">
                      {product.image ? (
                        <Image src={product.image} alt={product.name} width={200} height={200} className="rounded-xl mb-4 object-cover w-full h-40" />
                      ) : (
                        <div className="w-full h-40 bg-gray-200 rounded-xl mb-4 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">No Image</span>
                        </div>
                      )}
                      <h3 className="text-xl font-bold text-brown mb-2">{product.name}</h3>
                      <p className="text-lg font-semibold text-accent-gold mb-2">{product.price}</p>
                      {product.quantity && <p className="text-sm text-brown/70 mb-2 font-medium">Quantity: {product.quantity}</p>}
                      {product.weeklyCap && <p className="text-sm text-brown/50 mb-2">Weekly Cap: {product.weeklyCap}</p>}
                      {typeof product.weeklyAmountRemaining === 'number' && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-brown/50">Remaining:</span>
                          <span className="text-brown font-semibold text-base">{product.weeklyAmountRemaining}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => handleEdit(product)} className="bg-accent-gold text-brown px-4 py-2 rounded-lg font-semibold hover:bg-accent-gold/90 transition-colors duration-300 border-1 border-brown cursor-pointer">Edit</button>
                      <button onClick={() => handleDelete(product.id!, product.image)} className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors duration-300 cursor-pointer">Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 