import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, LogOut } from 'lucide-react';

interface LogoutButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function LogoutButton({ 
  variant = 'ghost', 
  size = 'default',
  className,
  showIcon = true,
  children 
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { signOut, user, isSupabaseConfigured } = useAuth();
  const isAuthenticated = !!user;
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!isAuthenticated || !isSupabaseConfigured) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signOut();
      
      if (error) {
        console.error('Logout error:', error);
        // Still navigate to home even if there's an error
      }
      
      // Navigate to home page after logout
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Unexpected logout error:', error);
      // Still navigate to home even if there's an error
      navigate('/', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if not authenticated or Supabase not configured
  if (!isAuthenticated || !isSupabaseConfigured) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {showIcon && <LogOut className="h-4 w-4" />}
          {children || 'Sign Out'}
        </>
      )}
    </Button>
  );
}

// Hook for programmatic logout
export function useLogout() {
  const [isLoading, setIsLoading] = useState(false);
  const { signOut, user, isSupabaseConfigured } = useAuth();
  const isAuthenticated = !!user;
  const navigate = useNavigate();

  const logout = async () => {
    if (!isAuthenticated || !isSupabaseConfigured) {
      return { error: null };
    }

    setIsLoading(true);

    try {
      const { error } = await signOut();
      
      if (!error) {
        navigate('/', { replace: true });
      }
      
      return { error };
    } catch (error) {
      console.error('Unexpected logout error:', error);
      navigate('/', { replace: true });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    logout,
    isLoading,
    isAuthenticated,
  };
}