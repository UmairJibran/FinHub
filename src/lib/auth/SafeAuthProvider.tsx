import { createContext, useContext, useState, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '../supabase/types';

// Safe auth context types (simplified for when Supabase is not configured)
export interface SafeAuthContextType {
  // State
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isSupabaseConfigured: boolean;

  // Actions (no-ops when Supabase is not configured)
  signIn: (credentials: {
    email: string;
    password: string;
  }) => Promise<{ error: any }>;
  signUp: (credentials: {
    email: string;
    password: string;
    fullName?: string;
  }) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshSession: () => Promise<void>;
  updateProfile: (updates: {
    full_name?: string;
    avatar_url?: string;
  }) => Promise<{ error: any }>;
}

// Create context
const SafeAuthContext = createContext<SafeAuthContextType | undefined>(
  undefined
);

// Auth provider props
interface SafeAuthProviderProps {
  children: ReactNode;
}

// Check if Supabase is configured
function isSupabaseConfigured(): boolean {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return !!(
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('your_supabase') &&
    !supabaseKey.includes('your_supabase') &&
    supabaseUrl.startsWith('https://')
  );
}

// Safe auth provider component
export function SafeAuthProvider({ children }: SafeAuthProviderProps) {
  const [user] = useState<User | null>(null);
  const [session] = useState<Session | null>(null);
  const [profile] = useState<UserProfile | null>(null);
  const [loading] = useState(false);
  const configured = isSupabaseConfigured();

  // No-op functions when Supabase is not configured
  const signIn = async () => ({ error: new Error('Supabase not configured') });
  const signUp = async () => ({ error: new Error('Supabase not configured') });
  const signInWithGoogle = async () => ({
    error: new Error('Supabase not configured'),
  });
  const signOut = async () => ({ error: new Error('Supabase not configured') });
  const refreshSession = async () => {};
  const updateProfile = async () => ({
    error: new Error('Supabase not configured'),
  });

  // Context value
  const value: SafeAuthContextType = {
    // State
    user,
    session,
    profile,
    loading,
    isAuthenticated: false,
    isSupabaseConfigured: configured,

    // Actions
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    refreshSession,
    updateProfile,
  };

  return (
    <SafeAuthContext.Provider value={value}>
      {children}
    </SafeAuthContext.Provider>
  );
}

// Hook to use safe auth context
export function useSafeAuth(): SafeAuthContextType {
  const context = useContext(SafeAuthContext);

  if (context === undefined) {
    throw new Error('useSafeAuth must be used within a SafeAuthProvider');
  }

  return context;
}
