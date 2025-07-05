'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { FiUsers, FiPackage, FiDollarSign, FiSettings, FiLogOut, FiHome } from 'react-icons/fi';

interface StatItem {
  title: string;
  value: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
}

interface ActivityItem {
  id: string;
  type: 'order' | 'customer' | 'product';
  title: string;
  description: string;
  time: string;
  color: string;
}

export default function AdminDashboard() {
  const { admin, logout, loading } = useAdminAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const stats: StatItem[] = [
    { title: 'Total Orders', value: '24', icon: FiPackage, color: 'text-accent-gold' },
    { title: 'Revenue Today', value: '$342', icon: FiDollarSign, color: 'text-accent-pink' },
    { title: 'Active Customers', value: '156', icon: FiUsers, color: 'text-cinnamon' },
  ];

  const recentActivity: ActivityItem[] = [
    {
      id: '1',
      type: 'order',
      title: 'New order received',
      description: 'Sourdough bread x2 - $13.00',
      time: '2 min ago',
      color: 'bg-accent-gold'
    },
    {
      id: '2',
      type: 'customer',
      title: 'Customer registered',
      description: 'john.doe@email.com',
      time: '15 min ago',
      color: 'bg-accent-pink'
    },
    {
      id: '3',
      type: 'product',
      title: 'Product updated',
      description: 'Brownie price changed to $4.50',
      time: '1 hour ago',
      color: 'bg-cinnamon'
    },
  ];

  const navItems = [
    { id: 'overview', label: 'Overview', icon: FiHome },
    { id: 'orders', label: 'Orders', icon: FiPackage },
    { id: 'products', label: 'Products', icon: FiPackage },
    { id: 'customers', label: 'Customers', icon: FiUsers },
    { id: 'settings', label: 'Settings', icon: FiSettings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-beige flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-accent-gold/20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold mx-auto mb-4"></div>
            <p className="text-brown">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-beige">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-accent-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-serif font-bold text-brown">
                Sour The Bakery Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-brown text-sm">
                Welcome, {admin?.email || 'Admin'}
              </span>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Logout from admin panel"
              >
                <FiLogOut size={16} />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
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
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 ${
                        activeTab === item.id
                          ? 'bg-accent-gold text-brown'
                          : 'text-brown hover:bg-accent-gold/10'
                      }`}
                      aria-current={activeTab === item.id ? 'page' : undefined}
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
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {stats.map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                      <div key={index} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-accent-gold/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-brown/70 text-sm font-medium">{stat.title}</p>
                            <p className="text-3xl font-bold text-brown mt-1">{stat.value}</p>
                          </div>
                          <div className={`p-3 rounded-xl bg-accent-gold/10 ${stat.color}`}>
                            <IconComponent size={24} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recent Activity */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-accent-gold/20">
                  <h2 className="text-xl font-serif font-bold text-brown mb-4">
                    Recent Activity
                  </h2>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-4 p-4 bg-cream/50 rounded-xl">
                        <div className={`w-3 h-3 ${activity.color} rounded-full`}></div>
                        <div>
                          <p className="text-brown font-medium">{activity.title}</p>
                          <p className="text-brown/70 text-sm">{activity.description}</p>
                        </div>
                        <span className="text-brown/50 text-sm ml-auto">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-accent-gold/20">
                <h2 className="text-xl font-serif font-bold text-brown mb-4">Orders Management</h2>
                <p className="text-brown/70">Orders management interface coming soon...</p>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-accent-gold/20">
                <h2 className="text-xl font-serif font-bold text-brown mb-4">Products Management</h2>
                <p className="text-brown/70">Products management interface coming soon...</p>
              </div>
            )}

            {activeTab === 'customers' && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-accent-gold/20">
                <h2 className="text-xl font-serif font-bold text-brown mb-4">Customer Management</h2>
                <p className="text-brown/70">Customer management interface coming soon...</p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-accent-gold/20">
                <h2 className="text-xl font-serif font-bold text-brown mb-4">Settings</h2>
                <p className="text-brown/70">Settings interface coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 