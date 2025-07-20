import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Safe Supabase client initialization
function createSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Check if Supabase is configured
  if (
    !url ||
    !anonKey ||
    url.includes('your_supabase') ||
    anonKey.includes('your_supabase') ||
    !url.startsWith('https://')
  ) {
    console.warn('Supabase is not configured. Using mock client.');
    // Return a mock client that won't cause errors
    return null;
  }

  try {
    console.log('Creating Supabase client with URL:', url);
    const client = createClient<Database>(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
    console.log('Supabase client created successfully');
    return client;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
}

export const supabase = createSupabaseClient();

// Helper to check if Supabase is available
export const isSupabaseAvailable = !!supabase;

// Export types for convenience
export type { Database } from './types';
export * from './types';
