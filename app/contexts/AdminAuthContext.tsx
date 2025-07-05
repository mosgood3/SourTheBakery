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

// List of admin emails - only pre-created Firebase accounts can access admin
// Add your specific admin email here after creating the account in Firebase Console
const ADMIN_EMAILS: string[] = [
  'sourthebakeryllc@gmail.com',
];

const isAdminEmail = (email: string): boolean => {
  // Ensure email is valid and in the admin list
  if (!email || typeof email !== 'string') {
    return false;
  }
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Check if the user is an admin
        const adminUser: AdminUser = {
          ...user,
          isAdmin: isAdminEmail(user.email || '')
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
      setLoading(true);
      
      // Validate email format and check if it's in admin list before attempting login
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address.');
      }
      
      if (!isAdminEmail(email)) {
        throw new Error('Access denied. This email is not authorized for admin access.');
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Double-check admin status after successful authentication
      if (!isAdminEmail(user.email || '')) {
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
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
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