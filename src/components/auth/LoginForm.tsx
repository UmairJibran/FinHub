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
import { Loader2, Mail } from 'lucide-react';

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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          Sign In to Your Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Google OAuth Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || isLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-gray-950 px-2 text-gray-500 dark:text-gray-400">
              Or continue with email
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
              className="w-full"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
      </CardContent>
    </Card>
  );
}