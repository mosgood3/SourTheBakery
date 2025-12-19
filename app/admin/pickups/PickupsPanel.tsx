import React, { useState, useEffect } from 'react';
import {
  getAllPickups,
  getPickupProducts,
  createPickup,
  updatePickup,
  deletePickup,
  addProductToPickup,
  updatePickupProduct,
  removeProductFromPickup,
  Pickup,
  PickupProduct
} from '../../lib/pickups-supabase';
import { getProducts, Product } from '../../lib/products-supabase';
import Image from 'next/image';
import { FiPlus, FiEdit2, FiTrash2, FiCalendar, FiClock, FiMapPin, FiPackage, FiX } from 'react-icons/fi';

export default function PickupsPanel({ admin }: { admin: any }) {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [managingProductsFor, setManagingProductsFor] = useState<string | null>(null);
  const [pickupProducts, setPickupProducts] = useState<PickupProduct[]>([]);

  const [formData, setFormData] = useState({
    order_window_start: '',
    order_window_end: '',
    pickup_date: '',
    pickup_time_start: '',
    pickup_time_end: '',
    pickup_location: '',
    is_active: true,
  });

  // Product assignment state
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [productQuantities, setProductQuantities] = useState<Record<string, { quantity: number; price: string }>>({});

  // Fetch pickups and products
  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedPickups, fetchedProducts] = await Promise.all([
        getAllPickups(),
        getProducts(false) // Only active products
      ]);
      setPickups(fetchedPickups);
      setProducts(fetchedProducts);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch pickup products when managing products
  const fetchPickupProducts = async (pickupId: string) => {
    try {
      const products = await getPickupProducts(pickupId);
      setPickupProducts(products);

      // Pre-populate selected products and quantities
      const selected = new Set(products.map(p => p.product_id));
      const quantities: Record<string, { quantity: number; price: string }> = {};
      products.forEach(p => {
        quantities[p.product_id] = {
          quantity: p.quantity_cap,
          price: p.price
        };
      });

      setSelectedProducts(selected);
      setProductQuantities(quantities);
    } catch (err) {
      setError('Failed to load pickup products');
    }
  };

  useEffect(() => {
    if (admin) fetchData();
  }, [admin]);

  useEffect(() => {
    if (managingProductsFor) {
      fetchPickupProducts(managingProductsFor);
    }
  }, [managingProductsFor]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);

      // Validation
      if (!formData.order_window_start || !formData.order_window_end) {
        setError('Order window dates are required');
        return;
      }
      if (!formData.pickup_date) {
        setError('Pickup date is required');
        return;
      }
      if (!formData.pickup_location.trim()) {
        setError('Pickup location is required');
        return;
      }

      const pickupData = {
        order_window_start: formData.order_window_start,
        order_window_end: formData.order_window_end,
        pickup_date: formData.pickup_date,
        pickup_time_start: formData.pickup_time_start || '09:00',
        pickup_time_end: formData.pickup_time_end || '12:00',
        pickup_location: formData.pickup_location,
        is_active: formData.is_active,
      };

      if (editingId) {
        await updatePickup(editingId, pickupData);
        setSuccess('Pickup updated successfully');
        setEditingId(null);
      } else {
        const newPickupId = await createPickup(pickupData);
        setSuccess('Pickup created successfully');
        setIsAdding(false);
        // Open product management for new pickup
        setManagingProductsFor(newPickupId);
      }

      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to save pickup');
    }
  };

  const handleEdit = (pickup: Pickup) => {
    setEditingId(pickup.id || null);
    setFormData({
      order_window_start: pickup.order_window_start ? pickup.order_window_start.slice(0, 10) : '',
      order_window_end: pickup.order_window_end ? pickup.order_window_end.slice(0, 10) : '',
      pickup_date: pickup.pickup_date || '',
      pickup_time_start: pickup.pickup_time_start || '',
      pickup_time_end: pickup.pickup_time_end || '',
      pickup_location: pickup.pickup_location || '',
      is_active: pickup.is_active ?? true,
    });
  };

  const handleDelete = async (id: string, pickupDate: string) => {
    const formattedDate = new Date(pickupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (window.confirm(`Are you sure you want to delete the pickup on ${formattedDate}? This will also remove all associated products and cannot be undone.`)) {
      try {
        await deletePickup(id);
        setSuccess('Pickup deleted successfully');
        fetchData();
      } catch (err) {
        setError('Failed to delete pickup');
      }
    }
  };

  const handleManageProducts = (pickupId: string) => {
    setManagingProductsFor(pickupId);
  };

  const handleToggleProduct = (productId: string, product: Product) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
      const newQuantities = { ...productQuantities };
      delete newQuantities[productId];
      setProductQuantities(newQuantities);
    } else {
      newSelected.add(productId);
      setProductQuantities({
        ...productQuantities,
        [productId]: {
          quantity: 10, // Default quantity
          price: product.price
        }
      });
    }
    setSelectedProducts(newSelected);
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setProductQuantities({
      ...productQuantities,
      [productId]: {
        ...productQuantities[productId],
        quantity: Math.max(0, quantity)
      }
    });
  };


  const handleSaveProducts = async () => {
    if (!managingProductsFor) return;

    try {
      setError(null);

      // Get current pickup products
      const currentProducts = pickupProducts.map(p => p.product_id);
      const newProducts = Array.from(selectedProducts);

      // Remove products that are no longer selected
      for (const productId of currentProducts) {
        if (!selectedProducts.has(productId)) {
          await removeProductFromPickup(managingProductsFor, productId);
        }
      }

      // Add or update selected products
      for (const productId of newProducts) {
        const existing = pickupProducts.find(p => p.product_id === productId);
        const product = products.find(p => p.id === productId);
        const quantity = productQuantities[productId]?.quantity || 10;
        const price = product?.price || '$0.00';

        if (existing) {
          // Update existing
          await updatePickupProduct(existing.id!, {
            quantity_cap: quantity,
            quantity_remaining: quantity,
            price
          });
        } else {
          // Add new
          await addProductToPickup({
            pickup_id: managingProductsFor,
            product_id: productId,
            quantity_cap: quantity,
            quantity_remaining: quantity,
            price,
            display_order: 0
          });
        }
      }

      setSuccess('Products updated successfully');
      setManagingProductsFor(null);
      fetchData();
    } catch (err) {
      setError('Failed to update products');
    }
  };

  const resetForm = () => {
    setFormData({
      order_window_start: '',
      order_window_end: '',
      pickup_date: '',
      pickup_time_start: '',
      pickup_time_end: '',
      pickup_location: '',
      is_active: true,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    resetForm();
  };

  const getOrderWindowStatus = (pickup: Pickup): string => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    const start = new Date(pickup.order_window_start);
    start.setHours(0, 0, 0, 0);

    const end = new Date(pickup.order_window_end);
    end.setHours(23, 59, 59, 999); // End of day

    if (now < start) return 'Upcoming';
    if (now > end) return 'Closed';
    return 'Open';
  };

  const formatDateOnly = (dateString: string): string => {
    // Handle both YYYY-MM-DD and full datetime formats
    const dateOnly = dateString.includes('T') ? dateString.split('T')[0] : dateString;
    const date = new Date(dateOnly + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDate = (dateString: string): string => {
    // Handle both YYYY-MM-DD and full datetime formats
    const dateOnly = dateString.includes('T') ? dateString.split('T')[0] : dateString;
    const date = new Date(dateOnly + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold"></div>
      </div>
    );
  }

  // Product Management Modal
  if (managingProductsFor) {
    const pickup = pickups.find(p => p.id === managingProductsFor);

    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-brown">Manage Products</h2>
            <p className="text-brown/70 mt-2">Assign products to pickup on {pickup ? new Date(pickup.pickup_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setManagingProductsFor(null)}
              className="bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProducts}
              className="bg-accent-gold text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors"
            >
              Save Products
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-800">
            {error}
          </div>
        )}

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-accent-gold/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => {
              const isSelected = selectedProducts.has(product.id!);
              const quantity = productQuantities[product.id!]?.quantity || 10;
              const price = productQuantities[product.id!]?.price || product.price;

              return (
                <div
                  key={product.id}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-accent-gold bg-accent-gold/10'
                      : 'border-gray-200 hover:border-accent-gold/50'
                  }`}
                  onClick={() => handleToggleProduct(product.id!, product)}
                >
                  <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <h3 className="font-semibold text-brown mb-2">{product.name}</h3>

                  {isSelected && (
                    <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <label className="text-sm text-brown/70">Quantity Available</label>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => handleQuantityChange(product.id!, parseInt(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                          min="0"
                        />
                      </div>
                      <p className="text-sm text-brown/50">Price: {product.price}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {products.length === 0 && (
            <div className="text-center py-12 text-brown/50">
              No products available. Create products first in the Products panel.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brown">Pickup Events</h2>
          <p className="text-brown/70 mt-2">Create and manage pickup events with custom menus</p>
        </div>

        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-accent-gold text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors flex items-center gap-2 border-2 border-brown"
          >
            <FiPlus size={20} />
            New Pickup
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-green-800">
          {success}
        </div>
      )}

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-accent-gold/20 mb-8">
          <h3 className="text-2xl font-bold text-brown mb-6">
            {editingId ? 'Edit Pickup Event' : 'Create New Pickup Event'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-brown font-semibold mb-2">
                Pickup Location *
              </label>
              <input
                type="text"
                value={formData.pickup_location}
                onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                placeholder="123 Main St, City, State"
                className="w-full border border-accent-gold/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent-gold"
                required
              />
            </div>

            <div className="border-t border-accent-gold/20 pt-6">
              <h4 className="text-lg font-semibold text-brown mb-4 flex items-center gap-2">
                <FiCalendar /> Order Window
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-brown font-semibold mb-2">
                    Orders Open (Date) *
                  </label>
                  <input
                    type="date"
                    value={formData.order_window_start}
                    onChange={(e) => setFormData({ ...formData, order_window_start: e.target.value })}
                    className="w-full border border-accent-gold/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent-gold"
                    required
                  />
                  <p className="text-sm text-brown/60 mt-1">All day - orders open from start of day</p>
                </div>

                <div>
                  <label className="block text-brown font-semibold mb-2">
                    Orders Close (Date) *
                  </label>
                  <input
                    type="date"
                    value={formData.order_window_end}
                    onChange={(e) => setFormData({ ...formData, order_window_end: e.target.value })}
                    className="w-full border border-accent-gold/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent-gold"
                    required
                  />
                  <p className="text-sm text-brown/60 mt-1">All day - orders close at end of day</p>
                </div>
              </div>
            </div>

            <div className="border-t border-accent-gold/20 pt-6">
              <h4 className="text-lg font-semibold text-brown mb-4 flex items-center gap-2">
                <FiClock /> Pickup Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-brown font-semibold mb-2">
                    Pickup Date *
                  </label>
                  <input
                    type="date"
                    value={formData.pickup_date}
                    onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                    className="w-full border border-accent-gold/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent-gold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-brown font-semibold mb-2">
                    Pickup Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.pickup_time_start}
                    onChange={(e) => setFormData({ ...formData, pickup_time_start: e.target.value })}
                    className="w-full border border-accent-gold/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent-gold"
                  />
                </div>

                <div>
                  <label className="block text-brown font-semibold mb-2">
                    Pickup End Time
                  </label>
                  <input
                    type="time"
                    value={formData.pickup_time_end}
                    onChange={(e) => setFormData({ ...formData, pickup_time_end: e.target.value })}
                    className="w-full border border-accent-gold/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent-gold"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 rounded border-accent-gold/30 text-accent-gold focus:ring-accent-gold"
              />
              <label htmlFor="is_active" className="text-brown font-semibold">
                Active (visible to customers)
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={cancelEdit}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-accent-gold text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors border-2 border-brown"
              >
                {editingId ? 'Update Pickup' : 'Create Pickup'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pickups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pickups.map(pickup => {
          const status = getOrderWindowStatus(pickup);
          const productCount = pickupProducts.filter(pp => pp.pickup_id === pickup.id).length;

          return (
            <div
              key={pickup.id}
              className="bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl border border-accent-gold/20 hover:shadow-2xl transition-shadow"
            >
              <div className={`p-6 ${!pickup.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-brown mb-1">{formatDate(pickup.pickup_date)}</h3>
                    {!pickup.is_active && (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">
                        Inactive
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      status === 'Open'
                        ? 'bg-green-100 text-green-800'
                        : status === 'Upcoming'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-brown/70 mb-4">
                  <div className="flex items-center gap-2">
                    <FiCalendar className="flex-shrink-0" />
                    <span>Pickup: {formatDate(pickup.pickup_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiClock className="flex-shrink-0" />
                    <span>
                      {pickup.pickup_time_start} - {pickup.pickup_time_end}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMapPin className="flex-shrink-0" />
                    <span className="line-clamp-1">{pickup.pickup_location}</span>
                  </div>
                </div>

                <div className="border-t border-accent-gold/20 pt-4 mb-4">
                  <div className="text-sm text-brown/70">
                    <div>Orders: {formatDateOnly(pickup.order_window_start)}</div>
                    <div className="ml-12">to {formatDateOnly(pickup.order_window_end)}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleManageProducts(pickup.id!)}
                    className="flex-1 bg-brown/10 text-brown px-4 py-2 rounded-lg hover:bg-brown/20 transition-colors flex items-center justify-center gap-2 text-sm border border-brown"
                  >
                    <FiPackage size={16} />
                    Products
                  </button>
                  <button
                    onClick={() => handleEdit(pickup)}
                    className="bg-accent-gold/20 text-brown px-4 py-2 rounded-lg hover:bg-accent-gold/30 transition-colors"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(pickup.id!, pickup.pickup_date)}
                    className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pickups.length === 0 && !isAdding && (
        <div className="text-center py-20">
          <FiCalendar className="mx-auto text-brown/30 mb-4" size={64} />
          <h3 className="text-2xl font-bold text-brown mb-2">No Pickup Events Yet</h3>
          <p className="text-brown/70 mb-6">Create your first pickup event to get started</p>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-accent-gold text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors inline-flex items-center gap-2"
          >
            <FiPlus size={20} />
            Create First Pickup
          </button>
        </div>
      )}
    </div>
  );
}
