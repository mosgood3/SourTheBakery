'use client';

import { useRouter } from 'next/navigation';
import { FiPackage } from 'react-icons/fi';

export default function AdminDashboard() {
  const router = useRouter();

  const navItems = [
    { id: 'products', label: 'Products', icon: FiPackage, href: '/admin/products' },
    { id: 'orders', label: 'Orders', icon: FiPackage, href: '/admin/orders' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-beige">
      <header className="bg-white/90 backdrop-blur-sm border-b border-accent-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-serif font-bold text-brown">
                Sour The Bakery Admin
              </h1>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-accent-gold/20" role="navigation" aria-label="Admin navigation">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => router.push(item.href)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 text-brown hover:bg-accent-gold/10`}
                    >
                      <IconComponent size={20} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
          {/* Main Content */}
          <div className="lg:col-span-3 flex items-center justify-center">
            <div className="text-brown/70 text-xl">Select a section from the sidebar.</div>
          </div>
        </div>
      </div>
    </div>
  );
} 