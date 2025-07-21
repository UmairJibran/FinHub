/**
 * Loading state components with user-friendly messages
 */

import React from 'react';
import { Loader2, Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Basic loading spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
  );
}

// Full page loading
interface PageLoadingProps {
  message?: string;
  description?: string;
}

export function PageLoading({ 
  message = 'Loading...', 
  description 
}: PageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <div>
          <h3 className="text-lg font-medium">{message}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Card loading skeleton
export function CardLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

// List loading skeleton
interface ListLoadingSkeletonProps {
  count?: number;
  showHeader?: boolean;
}

export function ListLoadingSkeleton({ count = 3, showHeader = true }: ListLoadingSkeletonProps) {
  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Table loading skeleton
interface TableLoadingSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableLoadingSkeleton({ rows = 5, columns = 4 }: TableLoadingSkeletonProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 p-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Inline loading with text
interface InlineLoadingProps {
  message?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function InlineLoading({ 
  message = 'Loading...', 
  size = 'sm',
  className 
}: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LoadingSpinner size={size} />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}

// Button loading state
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({ 
  loading = false, 
  loadingText = 'Loading...', 
  children, 
  disabled,
  className,
  ...props 
}: LoadingButtonProps) {
  return (
    <Button 
      disabled={loading || disabled} 
      className={className}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

// Network status indicator
interface NetworkStatusProps {
  isOnline?: boolean;
  quality?: 'good' | 'poor' | 'offline';
  showText?: boolean;
}

export function NetworkStatus({ 
  isOnline = true, 
  quality = 'good',
  showText = false 
}: NetworkStatusProps) {
  const getIcon = () => {
    if (!isOnline || quality === 'offline') {
      return <WifiOff className="h-4 w-4 text-destructive" />;
    }
    return <Wifi className={cn(
      'h-4 w-4',
      quality === 'poor' ? 'text-yellow-500' : 'text-green-500'
    )} />;
  };

  const getText = () => {
    if (!isOnline || quality === 'offline') return 'Offline';
    if (quality === 'poor') return 'Poor connection';
    return 'Online';
  };

  const getDescription = () => {
    if (!isOnline || quality === 'offline') {
      return 'Check your internet connection';
    }
    if (quality === 'poor') {
      return 'Slow connection detected';
    }
    return 'Connection is stable';
  };

  if (showText) {
    return (
      <Alert className={cn(
        'border-l-4',
        !isOnline || quality === 'offline' 
          ? 'border-l-destructive' 
          : quality === 'poor' 
          ? 'border-l-yellow-500' 
          : 'border-l-green-500'
      )}>
        {getIcon()}
        <AlertDescription>
          <span className="font-medium">{getText()}</span>
          <span className="text-muted-foreground ml-2">{getDescription()}</span>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex items-center gap-1" title={getText()}>
      {getIcon()}
    </div>
  );
}

// Error state with retry
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  showRetry?: boolean;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading data.',
  onRetry,
  retryText = 'Try again',
  showRetry = true,
  className
}: ErrorStateProps) {
  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <CardTitle className="text-lg mb-2">{title}</CardTitle>
        <CardDescription className="mb-4 max-w-md">
          {message}
        </CardDescription>
        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            {retryText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Empty state
interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = 'No data found',
  message = 'There are no items to display.',
  action,
  icon,
  className
}: EmptyStateProps) {
  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        {icon && <div className="mb-4">{icon}</div>}
        <CardTitle className="text-lg mb-2">{title}</CardTitle>
        <CardDescription className="mb-4 max-w-md">
          {message}
        </CardDescription>
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Progress indicator
interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function ProgressIndicator({ 
  steps, 
  currentStep, 
  className 
}: ProgressIndicatorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Step {currentStep + 1} of {steps.length}</span>
        <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
      <p className="text-sm font-medium">{steps[currentStep]}</p>
    </div>
  );
}