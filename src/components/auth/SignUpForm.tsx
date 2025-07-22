import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '@/lib/currency-config';

// Form validation schema
const signUpSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  preferredCurrency: z.string().min(1, 'Please select a currency'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

// Extended sign up credentials with preferred currency
interface ExtendedSignUpCredentials {
  email: string;
  password: string;
  fullName?: string;
  preferredCurrency?: string;
}

interface SignUpFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onSwitchToLogin?: () => void;
}

export function SignUpForm({ onSuccess, onError, onSwitchToLogin }: SignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { signUp, signInWithGoogle, isSupabaseConfigured } = useAuth();

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      preferredCurrency: DEFAULT_CURRENCY,
    },
  });

  // Handle email/password sign up
  const onSubmit = async (data: SignUpFormData) => {
    if (!isSupabaseConfigured) {
      setAuthError('Authentication is not configured. Please check your environment variables.');
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    setSuccessMessage(null);

    try {
      const { error } = await signUp({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        preferredCurrency: data.preferredCurrency,
      } as ExtendedSignUpCredentials);

      if (error) {
        const errorMessage = error.message || 'An error occurred during sign up';
        setAuthError(errorMessage);
        onError?.(errorMessage);
      } else {
        setSuccessMessage('Account created successfully! Please check your email to verify your account.');
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

  // Handle Google OAuth sign up
  const handleGoogleSignUp = async () => {
    if (!isSupabaseConfigured) {
      setAuthError('Authentication is not configured. Please check your environment variables.');
      return;
    }

    setIsGoogleLoading(true);
    setAuthError(null);
    setSuccessMessage(null);

    try {
      const { error } = await signInWithGoogle();

      if (error) {
        const errorMessage = error.message || 'An error occurred during Google sign up';
        setAuthError(errorMessage);
        onError?.(errorMessage);
        setIsGoogleLoading(false);
      }
      // Note: Don't set loading to false on success as redirect will happen
    } catch (error) {
      const errorMessage = 'An unexpected error occurred with Google sign up';
      setAuthError(errorMessage);
      onError?.(errorMessage);
      setIsGoogleLoading(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Authentication Not Configured</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please configure your Supabase environment variables to enable authentication.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Google OAuth Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 text-base font-medium border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
        onClick={handleGoogleSignUp}
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
            OR SIGN UP WITH EMAIL
          </span>
        </div>
      </div>

      {/* Email/Password Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="dark:text-slate-200">Full Name</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Enter your full name"
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="dark:text-slate-200">Email</FormLabel>
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
                <FormLabel className="dark:text-slate-200">Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Create a password"
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
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="dark:text-slate-200">Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm your password"
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
            name="preferredCurrency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="dark:text-slate-200">Preferred Currency</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading || isGoogleLoading}
                >
                  <FormControl>
                    <SelectTrigger className="dark:border-slate-700">
                      <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name} ({currency.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="dark:text-slate-300">
                  This will be your default currency across the application.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Success Message */}
          {successMessage && (
            <div className="text-sm text-green-600 dark:text-green-400 text-center bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {authError && (
            <div className="text-sm text-red-600 dark:text-red-400 text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
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
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>
      </Form>

      {/* Switch to Login */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        <p>
          Already have an account?{' '}
          <button
            type="button"
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            onClick={onSwitchToLogin}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}