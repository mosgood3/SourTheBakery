import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, Order } from '../../lib/products';
import { FiRefreshCw } from 'react-icons/fi';

export default function OrdersPanel({ admin }: { admin: any }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const fetchedOrders = await getOrders();
      setOrders(fetchedOrders);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (admin) fetchOrders(); }, [admin]);

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdatingStatus(orderId);
      await updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      setError('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const filteredOrders = orders.filter(order => order.status === activeTab);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-serif font-bold text-brown mb-2">Order Management</h1>
          <p className="text-brown/70">View and manage customer orders</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 bg-accent-gold border-1 border-brown text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors duration-300 shadow-md cursor-pointer"
          >
            <FiRefreshCw size={18} />
            Refresh Orders
          </button>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          className={`px-6 py-2 rounded-xl font-semibold transition-colors duration-300 focus:outline-none cursor-pointer 
            ${activeTab === 'pending' 
              ? 'text-2xl underline underline-offset-8 decoration-4 decoration-accent-gold text-brown' 
              : 'text-lg text-brown/60 hover:text-brown'}
          `}
          onClick={() => setActiveTab('pending')}
        >
          Pending Orders
        </button>
        <button
          className={`px-6 py-2 rounded-xl font-semibold transition-colors duration-300 focus:outline-none cursor-pointer 
            ${activeTab === 'completed' 
              ? 'text-2xl underline underline-offset-8 decoration-4 decoration-accent-gold text-brown' 
              : 'text-lg text-brown/60 hover:text-brown'}
          `}
          onClick={() => setActiveTab('completed')}
        >
          Completed Orders
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold"></div>
          <p className="mt-4 text-brown/70">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-brown/70 text-xl">No {activeTab} orders.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-accent-gold/20">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <h3 className="text-xl font-serif font-bold text-brown mb-2">Order #{order.id?.slice(-8)}</h3>
                  <p className="text-brown/70">Placed on {formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(order.status)}`}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-accent-gold">Total: ${order.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm font-semibold text-brown/70 mb-1">Customer</p>
                  <p className="text-brown font-medium">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-brown/70 mb-1">Email</p>
                  <p className="text-brown font-medium">{order.customerEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-brown/70 mb-1">Phone</p>
                  <p className="text-brown font-medium">{order.customerPhone}</p>
                </div>
              </div>
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-brown mb-3">Order Items</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-brown/5 rounded-lg">
                      <div>
                        <p className="font-medium text-brown">{item.productName}</p>
                        <p className="text-sm text-brown/70">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-brown">${(parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
              {activeTab === 'pending' && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStatusUpdate(order.id!, 'completed')}
                    disabled={updatingStatus === order.id || order.status === 'completed'}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-300 cursor-pointer ${order.status === 'completed' ? 'bg-green-100 text-green-600 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
                  >
                    {updatingStatus === order.id ? 'Updating...' : 'Mark Complete'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 