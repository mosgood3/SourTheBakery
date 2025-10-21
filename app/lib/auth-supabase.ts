import { supabase } from './supabase';

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Check if current user is admin (client-side)
export const checkIsAdmin = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user?.email) return false;

    // Check against admin email from env
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    return user.email === adminEmail;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};
