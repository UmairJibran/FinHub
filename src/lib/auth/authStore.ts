import { create } from 'zustand';
import { supabase, isSupabaseAvailable } from '../supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { AuthService, UserProfileService } from '../supabase/auth';
import type {
  UserProfile,
  SignInCredentials,
  SignUpCredentials,
} from '../supabase/auth';

interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;

  // Computed properties
  isAuthenticated: boolean;

  // Actions
  initialize: () => Promise<void>;
  loadUserProfile: (userId: string) => Promise<void>;
  signIn: (credentials: SignInCredentials) => Promise<{ error: any }>;
  signUp: (credentials: SignUpCredentials) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshSession: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: {
    full_name?: string;
    avatar_url?: string;
    preferred_currency?: string;
  }) => Promise<{ error: any }>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  error: null,

  // Computed properties
  get isAuthenticated() {
    return !!get().session;
  },

  // Initialize auth state
  initialize: async (): Promise<void> => {
    try {
      // Check if Supabase is available
      if (!isSupabaseAvailable || !supabase) {
        set({
          error: new Error('Supabase client not available'),
          isLoading: false,
        });
        return;
      }

      // Get initial session
      const { session: initialSession } = await AuthService.getSession();

      set({
        session: initialSession,
        user: initialSession?.user || null,
      });

      // Load user profile if authenticated
      if (initialSession?.user) {
        await get().loadUserProfile(initialSession.user.id);
      }

      // Set up auth state listener
      const {
        data: { subscription: _subscription },
      } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          console.log('Auth state changed:', event, session?.user?.id);

          set({
            session,
            user: session?.user || null,
          });

          if (session?.user) {
            // Load or create user profile
            await get().loadUserProfile(session.user.id);
          } else {
            set({ profile: null });
          }
        }
      );

      // We need to return void for the Promise<void> return type
      return;
    } catch (err) {
      set({
        error:
          err instanceof Error ? err : new Error('An unknown error occurred'),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // Load user profile (internal method)
  loadUserProfile: async (userId: string) => {
    try {
      let { profile: existingProfile, error } =
        await UserProfileService.getUserProfile(userId);

      if (error && error.code !== 'PGRST116') {
        // Not found error
        console.error('Error loading user profile:', error);
        return;
      }

      // Create profile if it doesn't exist
      if (!existingProfile && get().user) {
        const user = get().user;
        const { profile: newProfile, error: createError } =
          await UserProfileService.upsertUserProfile({
            id: userId,
            email: user?.email || '',
            full_name: user?.user_metadata?.full_name || null,
            avatar_url: user?.user_metadata?.avatar_url || null,
            preferred_currency: user?.user_metadata?.preferred_currency || 'USD',
          });

        if (createError) {
          console.error('Error creating user profile:', createError);
        } else {
          existingProfile = newProfile;
        }
      }

      set({ profile: existingProfile });
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    }
  },

  // Sign in with email/password
  signIn: async (credentials: SignInCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await AuthService.signInWithPassword(credentials);
      return { error };
    } finally {
      set({ isLoading: false });
    }
  },

  // Sign up with email/password
  signUp: async (credentials: SignUpCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await AuthService.signUp(credentials);
      return { error };
    } finally {
      set({ isLoading: false });
    }
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await AuthService.signInWithGoogle();
      return { error };
    } finally {
      // Don't set loading to false here as the redirect will happen
    }
  },

  // Sign out
  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await AuthService.signOut();
      if (!error) {
        set({
          user: null,
          session: null,
          profile: null,
        });
      }
      return { error };
    } finally {
      set({ isLoading: false });
    }
  },

  // Refresh session
  refreshSession: async () => {
    try {
      await AuthService.refreshSession();
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  },
  
  // Refresh user data including profile and preferences
  refreshUser: async () => {
    try {
      set({ isLoading: true });
      const { user } = get();
      
      if (!user) {
        console.warn('Cannot refresh user: No authenticated user');
        return;
      }
      
      // Refresh the session to get the latest user data
      await get().refreshSession();
      
      // Reload the user profile to get the latest preferences
      await get().loadUserProfile(user.id);
      
      console.log('User data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Update user profile
  updateProfile: async (updates: {
    full_name?: string;
    avatar_url?: string;
    preferred_currency?: string;
  }) => {
    const { user } = get();
    if (!user) {
      return { error: new Error('No authenticated user') };
    }

    try {
      const { profile: updatedProfile, error } =
        await UserProfileService.updateUserProfile(user.id, updates);

      if (!error && updatedProfile) {
        set({ profile: updatedProfile });
      }

      return { error };
    } catch (error) {
      return { error };
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

// Initialize auth state when the store is first imported
if (typeof window !== 'undefined') {
  useAuthStore.getState().initialize();
}

// Export types for convenience
export type { SignInCredentials, SignUpCredentials, UserProfile };
