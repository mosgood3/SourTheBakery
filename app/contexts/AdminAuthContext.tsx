'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { signIn, signOut, onAuthStateChange, checkIsAdmin } from '../lib/auth-supabase';
import type { User } from '@supabase/supabase-js';

interface AdminUser extends User {
  isAdmin?: boolean;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Admin email from environment
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL!;

const isAdminEmail = (email: string | undefined): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return email === ADMIN_EMAIL;
};

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run auth state listener on client side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    // Subscribe to auth state changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);

      if (session?.user) {
        // Check if the user is an admin
        const isAdmin = isAdminEmail(session.user.email);
        const adminUser: AdminUser = {
          ...session.user,
          isAdmin
        };
        setAdmin(adminUser);
      } else {
        setAdmin(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);

      // Validate email format
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address.');
      }

      const { user } = await signIn(email, password);

      // Check admin status after successful authentication
      console.log('User email:', user.email);
      console.log('Expected ADMIN_EMAIL:', ADMIN_EMAIL);
      console.log('Is admin check result:', isAdminEmail(user.email));

      if (!isAdminEmail(user.email)) {
        await signOut();
        throw new Error('Access denied. Admin privileges required.');
      }

      const adminUser: AdminUser = {
        ...user,
        isAdmin: true
      };
      setAdmin(adminUser);
    } catch (error: any) {
      console.error('Login error:', error);

      // Provide user-friendly error messages
      let errorMessage = 'Login failed. Please try again.';

      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please confirm your email address before logging in.';
      } else if (error.message?.includes('Access denied')) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut();
    } catch (error: any) {
      // Ignore 403 errors - session may already be expired
      console.log('Logout server call failed (session may be expired):', error.message);
    } finally {
      // Always clear local state regardless of server response
      setAdmin(null);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, error, login, logout, clearError }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
