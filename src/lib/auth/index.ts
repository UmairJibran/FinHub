// Auth module exports
export { AuthProvider, useAuth } from './AuthContext';
export type { AuthContextType, SignInCredentials, SignUpCredentials, UserProfile } from './AuthContext';

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