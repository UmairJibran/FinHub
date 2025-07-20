import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// Protected route props
interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

// Loading component
function AuthLoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}

/**
 * ProtectedRoute component that requires authentication
 * Redirects to login if user is not authenticated
 */
export function ProtectedRoute({
  children,
  redirectTo = '/auth/login',
  requireAuth = true,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return <AuthLoadingSpinner />;
  }

  // If auth is required and user is not authenticated, redirect to login
  if (requireAuth && !user) {
    return (
      <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
    );
  }

  // If auth is not required and user is authenticated, allow access
  // If auth is required and user is authenticated, allow access
  return <>{children}</>;
}

/**
 * PublicRoute component that redirects authenticated users
 * Useful for login/signup pages
 */
interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string;
  redirectIfAuthenticated?: boolean;
}

export function PublicRoute({
  children,
  redirectTo = '/dashboard',
  redirectIfAuthenticated = true,
}: PublicRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return <AuthLoadingSpinner />;
  }

  // If user is authenticated and we should redirect, go to dashboard
  if (redirectIfAuthenticated && user) {
    // Check if there's a redirect location from the login attempt
    const from = (location.state as any)?.from || redirectTo;
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

/**
 * AuthGuard component for conditional rendering based on auth state
 */
interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
  showLoading?: boolean;
}

export function AuthGuard({
  children,
  fallback = null,
  requireAuth = true,
  showLoading = true,
}: AuthGuardProps) {
  const { user, isLoading } = useAuth();

  // Show loading spinner while checking auth state
  if (isLoading && showLoading) {
    return <AuthLoadingSpinner />;
  }

  // Show children if auth requirement is met
  if ((requireAuth && user) || (!requireAuth && !user)) {
    return <>{children}</>;
  }

  // Show fallback if auth requirement is not met
  return <>{fallback}</>;
}

/**
 * Hook for programmatic navigation with auth checks
 */
export function useAuthNavigation() {
  const { user, isLoading } = useAuth();

  const requireAuth = (callback: () => void) => {
    if (isLoading) return;

    if (user) {
      callback();
    } else {
      // Could dispatch a login modal or redirect
      console.warn('Authentication required for this action');
    }
  };

  return {
    requireAuth,
    isAuthenticated: !!user,
    loading: isLoading,
  };
}

/**
 * Higher-order component for protecting components
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    redirectTo?: string;
    requireAuth?: boolean;
  } = {}
) {
  const { redirectTo = '/auth/login', requireAuth = true } = options;

  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute redirectTo={redirectTo} requireAuth={requireAuth}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
