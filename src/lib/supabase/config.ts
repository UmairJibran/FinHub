// Environment configuration validation for Supabase

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      'VITE_SUPABASE_URL is not set. Please add it to your .env.local file.\n' +
        'You can find this in your Supabase project settings under API > Project URL'
    );
  }

  if (!anonKey) {
    throw new Error(
      'VITE_SUPABASE_ANON_KEY is not set. Please add it to your .env.local file.\n' +
        'You can find this in your Supabase project settings under API > Project API keys > anon public'
    );
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    throw new Error(
      'VITE_SUPABASE_URL is not a valid URL. Please check your .env.local file.'
    );
  }

  return { url, anonKey };
}

export function validateSupabaseConnection(): boolean {
  try {
    getSupabaseConfig();
    return true;
  } catch (error) {
    return false;
  }
}
