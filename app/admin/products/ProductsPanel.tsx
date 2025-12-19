import React, { useState, useRef } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct, Product, archiveProduct, unarchiveProduct } from '../../lib/products-supabase';
import { uploadImageCompressed, isValidImageFile, isValidFileSize } from '../../lib/storage-supabase';
import Image from 'next/image';
import { FiPlus, FiArchive } from 'react-icons/fi';

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
    quantity: ''
  });
  const [showArchived, setShowArchived] = useState(false);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Admin view: fetch all products including archived ones
      const fetchedProducts = await getProducts(true);
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
      if (selectedFile) {
        // Compress product images to 1200px width with 85% quality
        imageUrl = await uploadImageCompressed(selectedFile, 'products', 1200, 85);
      }
      const productData = {
        name: formData.name,
        price: formData.price,
        image: imageUrl,
        quantity: formData.quantity
      };
      if (editingId) {
        await updateProduct(editingId, productData);
        setEditingId(null);
      } else {
        await addProduct(productData);
        setIsAdding(false);
      }
      setFormData({ name: '', price: '', image: '', quantity: '' }); setSelectedFile(null); setImagePreview(null);
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
      quantity: product.quantity || ''
    });
    setImagePreview(product.image); setSelectedFile(null);
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone. Consider archiving instead to preserve the data.')) {
      try { await deleteProduct(id, imageUrl); fetchProducts(); } catch (err) { setError('Failed to delete product'); }
    }
  };

  const handleArchive = async (id: string) => {
    if (window.confirm('Archive this product? It will be hidden from customers but can be restored later.')) {
      try { await archiveProduct(id); fetchProducts(); } catch (err) { setError('Failed to archive product'); }
    }
  };

  const handleUnarchive = async (id: string) => {
    try { await unarchiveProduct(id); fetchProducts(); } catch (err) { setError('Failed to unarchive product'); }
  };

  const cancelEdit = () => {
    setEditingId(null); setFormData({ name: '', price: '', image: '', quantity: '' }); setSelectedFile(null); setImagePreview(null); if (fileInputRef.current) { fileInputRef.current.value = ''; }
  };

  const triggerFileInput = () => { fileInputRef.current?.click(); };

  // Separate active and archived products
  const activeProducts = products.filter(p => !p.archived);
  const archivedProducts = products.filter(p => p.archived);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-brown mb-2">Product Management</h1>
          <p className="text-brown/70">Manage your bakery products</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center justify-center gap-2 bg-accent-gold border-2 border-brown text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors duration-300 shadow-md cursor-pointer"
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
      {/* Active Products List */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-accent-gold/20 mb-8">
        <h2 className="text-2xl font-serif font-bold text-brown mb-6">Active Products</h2>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold"></div>
            <p className="mt-4 text-brown/70">Loading products...</p>
          </div>
        ) : activeProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-brown/70 text-xl">No active products.</p>
            <p className="text-brown/50 mt-2">Add your first product to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeProducts.map((product) => (
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
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => handleEdit(product)} className="bg-accent-gold text-brown px-4 py-2 rounded-lg font-semibold hover:bg-accent-gold/90 transition-colors duration-300 border-1 border-brown cursor-pointer flex-1">Edit</button>
                      <button onClick={() => handleArchive(product.id!)} className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors duration-300 cursor-pointer flex items-center justify-center gap-1">
                        <FiArchive size={16} />
                        Archive
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archived Products Section */}
      {archivedProducts.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-accent-gold/20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif font-bold text-brown">Archived Products</h2>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="text-brown/70 hover:text-brown transition-colors duration-200 text-sm font-semibold"
            >
              {showArchived ? 'Hide' : 'Show'} ({archivedProducts.length})
            </button>
          </div>

          {showArchived && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {archivedProducts.map((product) => (
                <div key={product.id} className="bg-cream/80 rounded-2xl p-6 shadow border border-accent-gold/10 flex flex-col opacity-75">
                  <div className="flex-1">
                    {product.image ? (
                      <Image src={product.image} alt={product.name} width={200} height={200} className="rounded-xl mb-4 object-cover w-full h-40 grayscale" />
                    ) : (
                      <div className="w-full h-40 bg-gray-200 rounded-xl mb-4 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No Image</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-brown">{product.name}</h3>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">Archived</span>
                    </div>
                    <p className="text-lg font-semibold text-accent-gold mb-2">{product.price}</p>
                    {product.quantity && <p className="text-sm text-brown/70 mb-2 font-medium">Quantity: {product.quantity}</p>}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleUnarchive(product.id!)}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors duration-300 cursor-pointer flex-1"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handleDelete(product.id!, product.image)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors duration-300 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 