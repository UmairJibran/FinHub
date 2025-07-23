import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, isSupabaseAvailable } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

type CallbackState = 'loading' | 'success' | 'error';

export default function Callback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<CallbackState>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if Supabase is available
        if (!isSupabaseAvailable || !supabase) {
          setState('error');
          setError('Authentication is not configured. Please check your environment variables.');
          return;
        }

        // Handle the OAuth callback
        const { data, error: authError } = await supabase.auth.getSession();

        if (authError) {
          setState('error');
          setError(authError.message || 'Authentication failed');
          return;
        }

        if (data.session) {
          setState('success');
          
          // Get the intended destination from URL params or default to dashboard
          const redirectTo = searchParams.get('redirect_to') || '/dashboard';
          
          // Small delay to show success state
          setTimeout(() => {
            navigate(redirectTo, { replace: true });
          }, 1500);
        } else {
          setState('error');
          setError('No session found. Please try signing in again.');
        }
      } catch (err) {
        setState('error');
        setError('An unexpected error occurred during authentication.');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  const handleRetry = () => {
    navigate('/auth/login', { replace: true });
  };

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            {state === 'loading' && 'Completing Sign In...'}
            {state === 'success' && 'Sign In Successful!'}
            {state === 'error' && 'Sign In Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {state === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we complete your sign in...
              </p>
            </div>
          )}

          {state === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <p className="text-gray-600 dark:text-gray-400">
                You have been successfully signed in. Redirecting to your dashboard...
              </p>
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-4">
              <XCircle className="h-12 w-12 mx-auto text-red-600" />
              <div className="space-y-2">
                <p className="text-gray-600 dark:text-gray-400">
                  We encountered an issue while signing you in.
                </p>
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                    {error}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handleRetry} className="w-full sm:w-auto">
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleGoHome}
                  className="w-full sm:w-auto"
                >
                  Go Home
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
