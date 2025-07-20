// Auth module exports
export { useAuthStore } from './authStore';
export type { SignInCredentials, SignUpCredentials, UserProfile } from './authStore';

// Export the useAuth hook from hooks directory
export { useAuth } from '../../hooks/useAuth';

// Re-export auth services
export { AuthService, UserProfileService, SessionManager } from '../supabase/auth';
export type { AuthResult } from '../supabase/auth';

// Re-export protected route components
export { 
  ProtectedRoute, 
  PublicRoute, 
  AuthGuard, 
  withAuth, 
  useAuthNavigation 
} from '../../components/auth/ProtectedRoute';