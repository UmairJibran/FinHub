/**
 * Query optimization utilities for TanStack Query
 * Helps prevent duplicate requests and optimize cache usage
 */

import { QueryClient } from '@tanstack/react-query';
import { performanceMonitor } from './performance';
import { analytics } from './analytics';

interface QueryDeduplicationOptions {
  maxAge?: number; // Maximum age in milliseconds before allowing duplicate query
  key: string; // Unique key for tracking
}

class QueryOptimizer {
  private pendingQueries = new Map<string, Promise<any>>();
  private lastQueryTimes = new Map<string, number>();

  /**
   * Deduplicate queries to prevent multiple identical requests
   */
  deduplicateQuery<T>(
    queryFn: () => Promise<T>,
    options: QueryDeduplicationOptions
  ): Promise<T> {
    const { key, maxAge = 1000 } = options; // Default 1 second deduplication window
    const now = Date.now();
    const lastQueryTime = this.lastQueryTimes.get(key) || 0;

    // If we have a pending query for this key, return it
    if (this.pendingQueries.has(key)) {
      analytics.trackEvent({
        name: 'query-deduplicated',
        data: { key, type: 'pending' }
      });
      return this.pendingQueries.get(key)!;
    }

    // If the last query was too recent, skip
    if (now - lastQueryTime < maxAge) {
      analytics.trackEvent({
        name: 'query-deduplicated',
        data: { key, type: 'recent', timeSinceLastQuery: now - lastQueryTime }
      });
      // Return a resolved promise to avoid breaking the query
      return Promise.resolve(null as any);
    }

    // Execute the query
    const queryPromise = queryFn()
      .then((result) => {
        this.pendingQueries.delete(key);
        this.lastQueryTimes.set(key, now);
        return result;
      })
      .catch((error) => {
        this.pendingQueries.delete(key);
        throw error;
      });

    this.pendingQueries.set(key, queryPromise);
    return queryPromise;
  }

  /**
   * Clear deduplication cache for a specific key
   */
  clearDeduplication(key: string) {
    this.pendingQueries.delete(key);
    this.lastQueryTimes.delete(key);
  }

  /**
   * Clear all deduplication cache
   */
  clearAllDeduplication() {
    this.pendingQueries.clear();
    this.lastQueryTimes.clear();
  }
}

// Singleton instance
export const queryOptimizer = new QueryOptimizer();

/**
 * Enhanced query client configuration with performance optimizations
 */
export function createOptimizedQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
        // Disable automatic polling by default to reduce server load
        refetchInterval: false,
        refetchIntervalInBackground: false,
        // Network mode for better offline handling
        networkMode: 'online',
        // Retry configuration with exponential backoff
        retry: (failureCount, error: any) => {
          // Track API errors
          analytics.trackError('api_retry', 'query', {
            failureCount,
            errorMessage: error?.message,
            statusCode: error?.statusCode,
          });
          
          // Don't retry on auth errors
          if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
            return false;
          }
          // Don't retry on 4xx errors except 429 (rate limit)
          if (error?.statusCode >= 400 && error?.statusCode < 500 && error?.statusCode !== 429) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Enable structural sharing for better performance
        structuralSharing: true,
        // Keep previous data during refetch for better UX
        placeholderData: (previousData: any) => previousData,
      },
      mutations: {
        // Network mode for mutations
        networkMode: 'online',
        retry: (failureCount, error: any) => {
          // Track mutation errors
          analytics.trackError('api_mutation_retry', 'mutation', {
            failureCount,
            errorMessage: error?.message,
            statusCode: error?.statusCode,
          });
          
          // Don't retry mutations on client errors
          if (error?.statusCode >= 400 && error?.statusCode < 500) {
            return false;
          }
          // Retry up to 2 times for server errors
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
    },
  });
}

/**
 * Smart invalidation helper that prevents excessive invalidations
 */
export class SmartInvalidation {
  private queryClient: QueryClient;
  private invalidationQueue = new Map<string, NodeJS.Timeout>();
  private readonly DEBOUNCE_TIME = 100; // 100ms debounce

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Debounced invalidation to prevent excessive refetches
   */
  debouncedInvalidate(queryKey: string[], delay = this.DEBOUNCE_TIME) {
    const key = JSON.stringify(queryKey);
    
    // Clear existing timeout
    if (this.invalidationQueue.has(key)) {
      clearTimeout(this.invalidationQueue.get(key)!);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      this.queryClient.invalidateQueries({ queryKey });
      this.invalidationQueue.delete(key);
      
      analytics.trackEvent({
        name: 'query-invalidated',
        data: { queryKey: key, debounced: true }
      });
    }, delay);

    this.invalidationQueue.set(key, timeout);
  }

  /**
   * Batch invalidation for multiple query keys
   */
  batchInvalidate(queryKeys: string[][], delay = this.DEBOUNCE_TIME) {
    const timeout = setTimeout(() => {
      queryKeys.forEach(queryKey => {
        this.queryClient.invalidateQueries({ queryKey });
      });
      
      analytics.trackEvent({
        name: 'queries-batch-invalidated',
        data: { count: queryKeys.length }
      });
    }, delay);

    return () => clearTimeout(timeout);
  }

  /**
   * Clear all pending invalidations
   */
  clearPendingInvalidations() {
    this.invalidationQueue.forEach(timeout => clearTimeout(timeout));
    this.invalidationQueue.clear();
  }
}

/**
 * Performance monitoring wrapper for queries
 */
export function withQueryPerformanceTracking<T>(
  queryFn: () => Promise<T>,
  queryKey: string
): () => Promise<T> {
  return async () => {
    const startTime = performance.now();
    performanceMonitor.mark(`query_${queryKey}_start`);
    
    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;
      
      performanceMonitor.mark(`query_${queryKey}_end`);
      performanceMonitor.measure(
        `query_${queryKey}_duration`,
        `query_${queryKey}_start`,
        `query_${queryKey}_end`
      );
      
      performanceMonitor.trackApiCall(queryKey, duration, true);
      analytics.trackPerformance(
        `query_${queryKey}`,
        duration,
        duration < 500 ? 'good' : duration < 1000 ? 'needs-improvement' : 'poor'
      );
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackApiCall(queryKey, duration, false);
      analytics.trackError(`query_${queryKey}_failed`, 'api', { duration });
      throw error;
    }
  };
}

/**
 * React hook for smart query invalidation
 */
export function useSmartInvalidation() {
  const queryClient = new QueryClient();
  const smartInvalidation = new SmartInvalidation(queryClient);

  return {
    debouncedInvalidate: smartInvalidation.debouncedInvalidate.bind(smartInvalidation),
    batchInvalidate: smartInvalidation.batchInvalidate.bind(smartInvalidation),
    clearPendingInvalidations: smartInvalidation.clearPendingInvalidations.bind(smartInvalidation),
  };
}