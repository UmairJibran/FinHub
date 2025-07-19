import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getSupabaseConfig } from './config';

const { url, anonKey } = getSupabaseConfig();

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Export types for convenience
export type { Database } from './types';
export * from './types';
