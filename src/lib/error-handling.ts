/**
 * Centralized error handling utilities
 */

import { toast } from 'sonner';

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError extends Error {
  type: ErrorType;
  code?: string;
  statusCode?: number;
  details?: Record<string, any>;
  retryable?: boolean;
}

// Create a custom error class
export class CustomError extends Error implements AppError {
  type: ErrorType;
  code?: string;
  statusCode?: number;
  details?: Record<string, any>;
  retryable?: boolean;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    options: {
      code?: string;
      statusCode?: number;
      details?: Record<string, any>;
      retryable?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'CustomError';
    this.type = type;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.details = options.details;
    this.retryable = options.retryable ?? false;
    
    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

// Error classification utility
export function classifyError(error: any): AppError {
  if (error instanceof CustomError) {
    return error;
  }

  // Network errors
  if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
    return new CustomError(
      'Network connection failed. Please check your internet connection.',
      ErrorType.NETWORK,
      { retryable: true, cause: error }
    );
  }

  // Supabase auth errors
  if (error.message?.includes('JWT') || error.message?.includes('auth')) {
    return new CustomError(
      'Authentication failed. Please log in again.',
      ErrorType.AUTHENTICATION,
      { retryable: false, cause: error }
    );
  }

  // Supabase RLS errors
  if (error.message?.includes('RLS') || error.code === '42501') {
    return new CustomError(
      'You do not have permission to perform this action.',
      ErrorType.AUTHORIZATION,
      { retryable: false, cause: error }
    );
  }

  // Validation errors
  if (error.code === '23505' || error.message?.includes('duplicate')) {
    return new CustomError(
      'This item already exists. Please use a different name.',
      ErrorType.VALIDATION,
      { retryable: false, cause: error }
    );
  }

  // Not found errors
  if (error.code === 'PGRST116' || error.statusCode === 404) {
    return new CustomError(
      'The requested item was not found.',
      ErrorType.NOT_FOUND,
      { retryable: false, cause: error }
    );
  }

  // Server errors (5xx)
  if (error.statusCode >= 500 || error.message?.includes('server')) {
    return new CustomError(
      'Server error occurred. Please try again later.',
      ErrorType.SERVER,
      { retryable: true, statusCode: error.statusCode, cause: error }
    );
  }

  // Generic error
  return new CustomError(
    error.message || 'An unexpected error occurred.',
    ErrorType.UNKNOWN,
    { retryable: false, cause: error }
  );
}

// User-friendly error messages
export function getErrorMessage(error: AppError): string {
  switch (error.type) {
    case ErrorType.NETWORK:
      return 'Connection failed. Please check your internet and try again.';
    case ErrorType.AUTHENTICATION:
      return 'Please log in to continue.';
    case ErrorType.AUTHORIZATION:
      return 'You don\'t have permission for this action.';
    case ErrorType.VALIDATION:
      return error.message || 'Please check your input and try again.';
    case ErrorType.NOT_FOUND:
      return 'The requested item could not be found.';
    case ErrorType.SERVER:
      return 'Server is temporarily unavailable. Please try again later.';
    default:
      return error.message || 'Something went wrong. Please try again.';
  }
}

// Toast notification for errors
export function showErrorToast(error: any, customMessage?: string) {
  const appError = classifyError(error);
  const message = customMessage || getErrorMessage(appError);
  
  toast.error(message, {
    description: import.meta.env.DEV ? appError.message : undefined,
  });
}

// Success toast utility
export function showSuccessToast(message: string, description?: string) {
  toast.success(message, {
    description,
  });
}

// Retry mechanism with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => classifyError(error).retryable,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Hook for handling async operations with error handling
export function useErrorHandler() {
  const handleError = (error: any, customMessage?: string) => {
    console.error('Application Error:', error);
    showErrorToast(error, customMessage);
  };

  const handleSuccess = (message: string, description?: string) => {
    showSuccessToast(message, description);
  };

  return {
    handleError,
    handleSuccess,
  };
}