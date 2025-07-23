import { useAuthStore } from '../lib/auth/authStore';
import { useEffect } from 'react';
import { supabase, isSupabaseAvailable } from '../lib/supabase/client';

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
  
  // Create a safe version of refreshUser that won't cause loading state issues
  const safeRefreshUser = async () => {
    try {
      // Don't set loading state to true, just refresh the data
      const { user } = authStore;
      
      if (!user) {
        return;
      }
      
      // Just get the latest user profile without setting loading state
      if (isSupabaseConfigured && supabase) {
        await authStore.loadUserProfile(user.id);
      }
    } catch (error) {
      // Error in safeRefreshUser
    }
  };
  
  return {
    ...authStore,
    isSupabaseConfigured,
    // Add compatibility properties for components that expect the old context API
    loading: authStore.isLoading,
    // Replace refreshUser with our safe version
    refreshUser: safeRefreshUser
  };
}

// Export types for convenience
export type { 
  SignInCredentials, 
  SignUpCredentials, 
  UserProfile 
} from '../lib/auth/authStore';
