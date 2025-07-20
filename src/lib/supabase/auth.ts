import { supabase, isSupabaseAvailable } from './client';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import type { UserProfile } from './types';

// Authentication result types
export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends SignInCredentials {
  fullName?: string;
}

// Re-export UserProfile for convenience
export type { UserProfile } from './types';

// Authentication helper functions
export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signInWithPassword(
    credentials: SignInCredentials
  ): Promise<AuthResult> {
    if (!isSupabaseAvailable || !supabase) {
      return {
        user: null,
        session: null,
        error: { message: 'Supabase is not configured' } as AuthError,
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    return {
      user: data.user,
      session: data.session,
      error,
    };
  }

  /**
   * Sign up with email and password
   */
  static async signUp(credentials: SignUpCredentials): Promise<AuthResult> {
    if (!isSupabaseAvailable || !supabase) {
      return {
        user: null,
        session: null,
        error: { message: 'Supabase is not configured' } as AuthError,
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.fullName,
        },
      },
    });

    return {
      user: data.user,
      session: data.session,
      error,
    };
  }

  /**
   * Sign in with Google OAuth
   */
  static async signInWithGoogle(): Promise<{ error: AuthError | null }> {
    if (!isSupabaseAvailable || !supabase) {
      return { error: { message: 'Supabase is not configured' } as AuthError };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return { error };
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<{ error: AuthError | null }> {
    if (!isSupabaseAvailable || !supabase) {
      return { error: null }; // No error for sign out when not configured
    }

    const { error } = await supabase.auth.signOut();
    return { error };
  }

  /**
   * Get current session
   */
  static async getSession(): Promise<{
    session: Session | null;
    error: AuthError | null;
  }> {
    if (!isSupabaseAvailable || !supabase) {
      return {
        session: null,
        error: null,
      };
    }

    const { data, error } = await supabase.auth.getSession();
    return {
      session: data.session,
      error,
    };
  }

  /**
   * Get current user
   */
  static async getUser(): Promise<{
    user: User | null;
    error: AuthError | null;
  }> {
    if (!isSupabaseAvailable || !supabase) {
      return {
        user: null,
        error: null,
      };
    }

    const { data, error } = await supabase.auth.getUser();
    return {
      user: data.user,
      error,
    };
  }

  /**
   * Reset password
   */
  static async resetPassword(
    email: string
  ): Promise<{ error: AuthError | null }> {
    if (!isSupabaseAvailable || !supabase) {
      return {
        error: { message: 'Supabase is not configured' } as AuthError,
      };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    return { error };
  }

  /**
   * Update password
   */
  static async updatePassword(
    password: string
  ): Promise<{ error: AuthError | null }> {
    if (!isSupabaseAvailable || !supabase) {
      return {
        error: { message: 'Supabase is not configured' } as AuthError,
      };
    }
    const { error } = await supabase.auth.updateUser({
      password,
    });

    return { error };
  }

  /**
   * Refresh session
   */
  static async refreshSession(): Promise<{
    session: Session | null;
    error: AuthError | null;
  }> {
    if (!isSupabaseAvailable || !supabase) {
      return {
        session: null,
        error: { message: 'Supabase is not configured' } as AuthError,
      };
    }
    const { data, error } = await supabase.auth.refreshSession();
    return {
      session: data.session,
      error,
    };
  }
}

// User profile management
export class UserProfileService {
  /**
   * Get user profile
   */
  static async getUserProfile(
    userId: string
  ): Promise<{ profile: UserProfile | null; error: any }> {
    console.log('🚀 ~ UserProfileService ~ userId:', userId);
    if (!isSupabaseAvailable || !supabase) {
      return {
        profile: null,
        error: { message: 'Supabase is not configured' } as AuthError,
      };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    console.log('🚀 ~ UserProfileService ~ error:', error);
    console.log('🚀 ~ UserProfileService ~ data:', data);

    return {
      profile: data,
      error,
    };
  }

  /**
   * Create or update user profile
   */
  static async upsertUserProfile(profile: {
    id: string;
    email: string;
    full_name?: string | null;
    avatar_url?: string | null;
  }): Promise<{ profile: UserProfile | null; error: any }> {
    if (!isSupabaseAvailable || !supabase) {
      return {
        profile: null,
        error: { message: 'Supabase is not configured' } as AuthError,
      };
    }
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(profile, {
        onConflict: 'id',
      })
      .select()
      .single();

    return {
      profile: data,
      error,
    };
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    userId: string,
    updates: {
      full_name?: string | null;
      avatar_url?: string | null;
    }
  ): Promise<{ profile: UserProfile | null; error: any }> {
    if (!isSupabaseAvailable || !supabase) {
      return {
        profile: null,
        error: { message: 'Supabase is not configured' } as AuthError,
      };
    }
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    return {
      profile: data,
      error,
    };
  }
}

// Session management utilities
export class SessionManager {
  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const { session } = await AuthService.getSession();
    return !!session;
  }

  /**
   * Get authentication state
   */
  static async getAuthState(): Promise<{
    isAuthenticated: boolean;
    user: User | null;
    session: Session | null;
  }> {
    const { session, error } = await AuthService.getSession();

    if (error || !session) {
      return {
        isAuthenticated: false,
        user: null,
        session: null,
      };
    }

    return {
      isAuthenticated: true,
      user: session.user,
      session,
    };
  }

  /**
   * Wait for auth state to be ready
   */
  static async waitForAuth(): Promise<{
    isAuthenticated: boolean;
    user: User | null;
    session: Session | null;
  }> {
    // Wait for initial auth state
    return new Promise((resolve) => {
      if (!isSupabaseAvailable || !supabase) {
        return {
          user: null,
          session: null,
          error: { message: 'Supabase is not configured' } as AuthError,
        };
      }
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        subscription.unsubscribe();
        resolve({
          isAuthenticated: !!session,
          user: session?.user || null,
          session,
        });
      });
    });
  }
}
