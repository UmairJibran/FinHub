import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { validateEnvironmentVariables } from '../input-sanitization';

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
    // Return a mock client that won't cause errors
    return null;
  }

  try {
    // Validate environment variables
    validateEnvironmentVariables();
    
    const client = createClient<Database>(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Security enhancements
        flowType: 'pkce',
        storage: window.localStorage,
        storageKey: 'supabase.auth.token',
      },
      global: {
        headers: {
          'X-Client-Info': 'portfolio-tracker',
        },
      },
      // Rate limiting and timeout configurations
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    return client;
  } catch (error) {
    return null;
  }
}

export const supabase = createSupabaseClient();

// Helper to check if Supabase is available
export const isSupabaseAvailable = !!supabase;

// Export types for convenience
export type { Database } from './types';
export * from './types';
