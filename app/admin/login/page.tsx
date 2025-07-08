'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, error: contextError, clearError, admin } = useAdminAuth();
  const router = useRouter();

  // Clear context error when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Redirect if already logged in
  useEffect(() => {
    if (admin) {
      router.push('/admin/dashboard');
    }
  }, [admin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);

    try {
      await login(email, password);
      // Navigation will be handled by the useEffect above
    } catch (error: any) {
      setLocalError(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  // Use context error if available, otherwise use local error
  const displayError = contextError || localError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-beige flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-accent-gold/20">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-brown mb-2">
              Admin Login
            </h1>
            <p className="text-brown/70">
              Access your bakery management dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-brown mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-brown/20 focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all duration-300 bg-white/50"
                placeholder="admin@bakery.com"
                required
                disabled={loading}
                aria-describedby={displayError ? "error-message" : undefined}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-brown mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-brown/20 focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all duration-300 bg-white/50"
                placeholder="Enter your password"
                required
                disabled={loading}
                aria-describedby={displayError ? "error-message" : undefined}
              />
            </div>

            {displayError && (
              <div 
                id="error-message"
                className="bg-red-50 border border-red-200 rounded-xl p-4"
                role="alert"
                aria-live="polite"
              >
                <p className="text-red-600 text-sm">{displayError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-gold text-brown border-1 bg-cinnamon cursor-pointer border-brown py-3 px-6 rounded-xl font-semibold hover:bg-accent-gold/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Back to Site */}
          <div className="text-center mt-6">
            <a
              href="/"
              className="text-brown/70 font-bold hover:text-accent-gold transition-colors duration-300 text-sm focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 rounded"
            >
              ← Back to Bakery
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 