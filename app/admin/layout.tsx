'use client';

import { AdminAuthProvider } from '../contexts/AdminAuthContext';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { admin, loading, error } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !admin && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [admin, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-beige flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-accent-gold/20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold mx-auto mb-4"></div>
            <p className="text-brown">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-beige flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-accent-gold/20">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-brown mb-2">Authentication Error</h2>
            <p className="text-brown/70 mb-4">{error}</p>
            <button
              onClick={() => router.push('/admin/login')}
              className="bg-accent-gold text-brown px-6 py-2 rounded-lg hover:bg-accent-gold/90 transition-colors duration-300"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!admin && pathname !== '/admin/login') {
    return null;
  }

  // Check if user is actually an admin (additional security check)
  if (admin && !admin.isAdmin && pathname !== '/admin/login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-beige flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-accent-gold/20">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">🚫</div>
            <h2 className="text-xl font-bold text-brown mb-2">Access Denied</h2>
            <p className="text-brown/70 mb-4">You don't have admin privileges to access this area.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-accent-gold text-brown px-6 py-2 rounded-lg hover:bg-accent-gold/90 transition-colors duration-300"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminAuthGuard>
        {children}
      </AdminAuthGuard>
    </AdminAuthProvider>
  );
} 