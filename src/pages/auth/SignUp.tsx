import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';

export default function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  // Get the intended destination from location state, default to dashboard
  const from = (location.state as any)?.from || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      navigate(from, { replace: true });
    }
  }, [user, isLoading, navigate, from]);

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  // Don't render form if already authenticated
  if (user) {
    return null;
  }

  const handleSignUpSuccess = () => {
    // For sign up, we might want to show a success message or redirect to login
    // depending on email verification requirements
    navigate('/auth/login', { 
      replace: true,
      state: { 
        message: 'Account created successfully! Please check your email to verify your account.' 
      }
    });
  };

  const handleSignUpError = (error: string) => {
    console.error('Sign up error:', error);
    // Error is already displayed in the SignUpForm component
  };

  const handleLoginSuccess = () => {
    navigate(from, { replace: true });
  };

  const handleLoginError = (error: string) => {
    console.error('Login error:', error);
    // Error is already displayed in the LoginForm component
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {showLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="mt-3 text-muted-foreground">
              {showLogin 
                ? 'Sign in to access your portfolio dashboard and continue your financial journey'
                : 'Join thousands of investors tracking their portfolios with our comprehensive platform'
              }
            </p>
          </div>
          
          {showLogin ? (
            <LoginForm
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
            />
          ) : (
            <SignUpForm
              onSuccess={handleSignUpSuccess}
              onError={handleSignUpError}
              onSwitchToLogin={() => setShowLogin(true)}
            />
          )}

          {showLogin && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  onClick={() => setShowLogin(false)}
                >
                  Sign up
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}