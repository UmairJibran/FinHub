import {
  useAuth as useFullAuth,
  AuthContextType as FullAuthContextType,
} from '../lib/auth/AuthContext';
import { useSafeAuth } from '../lib/auth/SafeAuthProvider';

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

// Unified auth context type
export type AuthContextType = FullAuthContextType & {
  isSupabaseConfigured: boolean;
};

// Hook that automatically uses the correct auth provider
export function useAuth(): AuthContextType {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const fullAuth = useFullAuth();
      return {
        ...fullAuth,
        isSupabaseConfigured: true,
      };
    } catch (error) {
      // Fallback to safe auth if full auth fails
      const safeAuth = useSafeAuth();
      return {
        ...safeAuth,
        isSupabaseConfigured: false,
      };
    }
  } else {
    const safeAuth = useSafeAuth();
    return {
      ...safeAuth,
      isSupabaseConfigured: false,
    };
  }
}
