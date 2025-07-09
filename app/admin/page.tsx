'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import ProductsPanel from './products/ProductsPanel';
import OrdersPanel from './orders/OrdersPanel';

export default function AdminTabbedPanel() {
  const { admin, loading: authLoading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');

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
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-4 mb-8">
          <button
            className={`px-6 py-2 rounded-xl font-semibold transition-colors duration-300 ${activeTab === 'products' ? 'bg-accent-gold text-brown' : 'bg-white text-brown/60 border border-accent-gold/30'}`}
            onClick={() => setActiveTab('products')}
          >
            Products
          </button>
          <button
            className={`px-6 py-2 rounded-xl font-semibold transition-colors duration-300 ${activeTab === 'orders' ? 'bg-accent-gold text-brown' : 'bg-white text-brown/60 border border-accent-gold/30'}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
        </div>
        {activeTab === 'products' && <ProductsPanel admin={admin} />}
        {activeTab === 'orders' && <OrdersPanel admin={admin} />}
      </div>
    </div>
  );
} 