'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import ProductsPanel from './products/ProductsPanel';
import OrdersPanel from './orders/OrdersPanel';
import { FiLogOut } from 'react-icons/fi';

export default function AdminTabbedPanel() {
  const { admin, loading: authLoading, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('orders');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-beige flex flex-col">
      {/* Header */}
      <header className="w-full bg-white/90 backdrop-blur-sm border-b border-accent-gold/20 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-serif font-bold text-brown">Sour The Bakery Admin</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-600 transition-colors duration-300 shadow-md flex items-center gap-2 cursor-pointer"
        >
          <FiLogOut size={16} />
          Logout
        </button>
      </header>

      {/* Tabs */}
      <nav className="w-full bg-white/80 border-b border-accent-gold/10 px-6 flex gap-2">
        <button
          className={`px-6 py-3 text-lg font-semibold border-b-4 transition-all duration-200 cursor-pointer ${
            activeTab === "orders"
              ? "border-accent-gold text-brown"
              : "border-transparent text-brown/50 hover:text-brown"
          }`}
          onClick={() => setActiveTab("orders")}
        >
          Orders
        </button>
        <button
          className={`px-6 py-3 text-lg font-semibold border-b-4 transition-all duration-200 cursor-pointer ${
            activeTab === "products"
              ? "border-accent-gold text-brown"
              : "border-transparent text-brown/50 hover:text-brown"
          }`}
          onClick={() => setActiveTab("products")}
        >
          Products
        </button>
      </nav>

      {/* Tab Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "orders" && <OrdersPanel admin={admin} />}
        {activeTab === "products" && <ProductsPanel admin={admin} />}
      </main>
    </div>
  );
} 