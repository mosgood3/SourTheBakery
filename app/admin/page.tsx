'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import ProductsPanel from './products/ProductsPanel';
import OrdersPanel from './orders/OrdersPanel';
import SettingsPanel from './settings/SettingsPanel';
import NewsletterPanel from './newsletter/NewsletterPanel';
import GalleryPanel from './gallery/GalleryPanel';
import RecipesPanel from './recipes/RecipesPanel';
import { FiLogOut, FiMenu, FiX, FiShoppingBag, FiPackage, FiSettings, FiMail, FiImage, FiBook } from 'react-icons/fi';

export default function AdminTabbedPanel() {
  const { admin, loading: authLoading, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'settings' | 'newsletter' | 'gallery' | 'recipes'>('orders');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const menuItems = [
    { key: 'orders', label: 'Orders', icon: FiShoppingBag },
    { key: 'products', label: 'Products', icon: FiPackage },
    { key: 'recipes', label: 'Recipes', icon: FiBook },
    { key: 'gallery', label: 'Gallery', icon: FiImage },
    { key: 'newsletter', label: 'Newsletter', icon: FiMail },
    { key: 'settings', label: 'Settings', icon: FiSettings },
  ];

  const handleTabChange = (tab: 'products' | 'orders' | 'settings' | 'newsletter' | 'gallery' | 'recipes') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-beige flex flex-col">
      {/* Header */}
      <header className="w-full bg-white/90 backdrop-blur-sm border-b border-accent-gold/20 px-4 sm:px-6 py-4 flex justify-between items-center relative">
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-brown">Admin</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="hidden md:flex bg-red-500 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold hover:bg-red-600 transition-colors duration-300 shadow-md items-center gap-2 cursor-pointer text-sm sm:text-base"
          >
            <FiLogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-brown hover:text-accent-gold transition-colors duration-300 cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Menu */}
      <div className={`
        fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-6 border-b border-accent-gold/20">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-brown">Menu</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-brown hover:text-accent-gold transition-colors duration-300"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>
        <nav className="p-4">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => handleTabChange(item.key as 'products' | 'orders' | 'settings' | 'newsletter' | 'gallery' | 'recipes')}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 mb-2 ${
                  activeTab === item.key
                    ? "bg-accent-gold/20 text-brown border-l-4 border-accent-gold"
                    : "text-brown/70 hover:text-brown hover:bg-accent-gold/10"
                }`}
              >
                <IconComponent size={20} />
                <span className="font-semibold">{item.label}</span>
              </button>
            );
          })}
          
          {/* Logout Button as Menu Item */}
          <div className="border-t border-accent-gold/20 pt-4 mt-4">
            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all duration-200 font-semibold mb-2"
            >
              <FiLogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Desktop Tabs */}
      <nav className="hidden md:flex w-full bg-white/80 border-b border-accent-gold/10 px-6 gap-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.key}
              className={`px-6 py-3 text-lg font-semibold border-b-4 transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                activeTab === item.key
                  ? "border-accent-gold text-brown"
                  : "border-transparent text-brown/50 hover:text-brown"
              }`}
              onClick={() => setActiveTab(item.key as 'products' | 'orders' | 'settings' | 'newsletter' | 'gallery' | 'recipes')}
            >
              <IconComponent size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Tab Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "orders" && <OrdersPanel admin={admin} />}
        {activeTab === "products" && <ProductsPanel admin={admin} />}
        {activeTab === "recipes" && <RecipesPanel admin={admin} />}
        {activeTab === "gallery" && <GalleryPanel />}
        {activeTab === "newsletter" && <NewsletterPanel />}
        {activeTab === "settings" && <SettingsPanel admin={admin} />}
      </main>
    </div>
  );
} 