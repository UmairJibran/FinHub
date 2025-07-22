import { useAuthStore } from '../lib/auth/authStore';
import { useEffect } from 'react';

// Check if Supabase is configured
function checkSupabaseConfig(): boolean {
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

/**
 * Custom hook to access authentication functionality using Zustand
 * 
 * @param options - Hook options
 * @param options.refreshOnMount - Whether to refresh user data on component mount (default: false)
 */
export function useAuth({ refreshOnMount = false } = {}) {
  const authStore = useAuthStore();
  const isSupabaseConfigured = checkSupabaseConfig();
  
  // Initialize auth on first mount if Supabase is configured
  useEffect(() => {
    if (isSupabaseConfigured && authStore.isLoading && !authStore.user && !authStore.error) {
      authStore.initialize();
    }
  }, [isSupabaseConfigured]);
  
  // Refresh user data on mount if requested
  useEffect(() => {
    if (refreshOnMount && authStore.user && !authStore.isLoading) {
      authStore.refreshUser();
    }
  }, [refreshOnMount, authStore.user !== null]);
  
  return {
    ...authStore,
    isSupabaseConfigured,
    // Add compatibility properties for components that expect the old context API
    loading: authStore.isLoading
  };
}

// Export types for convenience
export type { 
  SignInCredentials, 
  SignUpCredentials, 
  UserProfile 
} from '../lib/auth/authStore';
