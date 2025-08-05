'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { auth } from '../lib/firebase';

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

// List of admin UIDs - only pre-created Firebase accounts can access admin
// Add your specific admin UID here after creating the account in Firebase Console
const ADMIN_UIDS: string[] = [
  process.env.NEXT_PUBLIC_ADMIN_UID!,
];

const isAdminUID = (uid: string): boolean => {
  // Ensure UID is valid and in the admin list
  if (!uid || typeof uid !== 'string') {
    return false;
  }
  return ADMIN_UIDS.includes(uid);
};

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run auth state listener on client side and when auth is available
    if (typeof window === 'undefined' || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Check if the user is an admin
        const adminUser: AdminUser = {
          ...user,
          isAdmin: isAdminUID(user.uid)
        };
        setAdmin(adminUser);
      } else {
        setAdmin(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setError('Authentication error occurred');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      // Don't set loading to true here to prevent flash
      
      // Check if auth is available
      if (!auth) {
        throw new Error('Authentication service not available');
      }
      
      // Validate email format
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address.');
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Double-check admin status after successful authentication
      console.log('User UID:', user.uid);
      console.log('Expected ADMIN_UID:', process.env.NEXT_PUBLIC_ADMIN_UID);
      console.log('Admin UIDs array:', ADMIN_UIDS);
      console.log('Is admin check result:', isAdminUID(user.uid));
      
      if (!isAdminUID(user.uid)) {
        await signOut(auth);
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
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.message && error.message.includes('Access denied')) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      throw error;
    }
    // Don't set loading to false here to prevent flash
  };

  const logout = async () => {
    try {
      setError(null);
      if (!auth) {
        throw new Error('Authentication service not available');
      }
      await signOut(auth);
      setAdmin(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      setError(error.message || 'Logout failed. Please try again.');
      throw error;
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