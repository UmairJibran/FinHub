import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { AuthService, UserProfileService } from '../supabase/auth';
import type {
  UserProfile,
  SignInCredentials,
  SignUpCredentials,
} from '../supabase/auth';

// Auth context types
export interface AuthContextType {
  // State
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;

  // Actions
  signIn: (credentials: SignInCredentials) => Promise<{ error: any }>;
  signUp: (credentials: SignUpCredentials) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshSession: () => Promise<void>;
  updateProfile: (updates: {
    full_name?: string;
    avatar_url?: string;
  }) => Promise<{ error: any }>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        // Get initial session
        const { session: initialSession } = await AuthService.getSession();

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user || null);

          // Load user profile if authenticated
          if (initialSession?.user) {
            await loadUserProfile(initialSession.user.id);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.id);

        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          // Load or create user profile
          await loadUserProfile(session.user.id);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load user profile
  const loadUserProfile = async (userId: string) => {
    try {
      let { profile: existingProfile, error } =
        await UserProfileService.getUserProfile(userId);

      if (error && error.code !== 'PGRST116') {
        // Not found error
        console.error('Error loading user profile:', error);
        return;
      }

      // Create profile if it doesn't exist
      if (!existingProfile && user) {
        const { profile: newProfile, error: createError } =
          await UserProfileService.upsertUserProfile({
            id: userId,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
          });

        if (createError) {
          console.error('Error creating user profile:', createError);
        } else {
          existingProfile = newProfile;
        }
      }

      setProfile(existingProfile);
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    }
  };

  // Sign in with email/password
  const signIn = async (credentials: SignInCredentials) => {
    setLoading(true);
    try {
      const { error } = await AuthService.signInWithPassword(credentials);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email/password
  const signUp = async (credentials: SignUpCredentials) => {
    setLoading(true);
    try {
      const { error } = await AuthService.signUp(credentials);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await AuthService.signInWithGoogle();
      return { error };
    } finally {
      // Don't set loading to false here as the redirect will happen
    }
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await AuthService.signOut();
      if (!error) {
        setUser(null);
        setSession(null);
        setProfile(null);
      }
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Refresh session
  const refreshSession = async () => {
    try {
      await AuthService.refreshSession();
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  // Update user profile
  const updateProfile = async (updates: {
    full_name?: string;
    avatar_url?: string;
  }) => {
    if (!user) {
      return { error: new Error('No authenticated user') };
    }

    try {
      const { profile: updatedProfile, error } =
        await UserProfileService.updateUserProfile(user.id, updates);

      if (!error && updatedProfile) {
        setProfile(updatedProfile);
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Context value
  const value: AuthContextType = {
    // State
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!session,

    // Actions
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    refreshSession,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// Export types for convenience
export type { SignInCredentials, SignUpCredentials, UserProfile };
