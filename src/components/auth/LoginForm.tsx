import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

// Form validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { signIn, signInWithGoogle, isSupabaseConfigured } = useAuth();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Handle email/password login
  const onSubmit = async (data: LoginFormData) => {
    if (!isSupabaseConfigured) {
      setAuthError('Authentication is not configured. Please check your environment variables.');
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      const { error } = await signIn(data);

      if (error) {
        const errorMessage = error.message || 'An error occurred during login';
        setAuthError(errorMessage);
        onError?.(errorMessage);
      } else {
        onSuccess?.();
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred';
      setAuthError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth login
  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      setAuthError('Authentication is not configured. Please check your environment variables.');
      return;
    }

    setIsGoogleLoading(true);
    setAuthError(null);

    try {
      const { error } = await signInWithGoogle();

      if (error) {
        const errorMessage = error.message || 'An error occurred during Google login';
        setAuthError(errorMessage);
        onError?.(errorMessage);
        setIsGoogleLoading(false);
      }
      // Note: Don't set loading to false on success as redirect will happen
    } catch (error) {
      const errorMessage = 'An unexpected error occurred with Google login';
      setAuthError(errorMessage);
      onError?.(errorMessage);
      setIsGoogleLoading(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Authentication Not Configured</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Please configure your Supabase environment variables to enable authentication.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
        {/* Google OAuth Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 text-base font-medium border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || isLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
          ) : (
            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white/80 dark:bg-gray-800/80 px-4 py-1 text-muted-foreground rounded-full backdrop-blur-sm">
              OR CONTINUE WITH EMAIL
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      disabled={isLoading || isGoogleLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      disabled={isLoading || isGoogleLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Error Message */}
            {authError && (
              <div className="text-sm text-red-600 dark:text-red-400 text-center">
                {authError}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </Form>

        {/* Additional Links */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              onClick={() => {
                // TODO: Implement sign up functionality or navigate to sign up page
                console.log('Sign up clicked - implement navigation');
              }}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
  );
}