/**
 * Hook for accessing cache management utilities
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { CacheManager } from '../lib/cache-utils';
import { useAuth } from '../../../hooks/useAuth';

/**
 * Hook that provides access to cache management utilities
 */
export function useCacheManager() {
  const queryClient = useQueryClient();
  const cacheManager = new CacheManager(queryClient);
  
  return cacheManager;
}

/**
 * Hook for managing cache lifecycle based on authentication state
 */
export function useCacheLifecycle() {
  const { user, isAuthenticated } = useAuth();
  const cacheManager = useCacheManager();

  // Clear cache when user logs out
  useEffect(() => {
    if (!isAuthenticated && !user) {
      cacheManager.persistence.clearUserData();
    }
  }, [isAuthenticated, user, cacheManager]);

  // Prefetch critical data when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      cacheManager.persistence.prefetchCriticalData(user.id);
    }
  }, [isAuthenticated, user, cacheManager]);

  return cacheManager;
}

/**
 * Hook for setting up real-time cache updates
 */
export function useRealTimeCacheUpdates() {
  const cacheManager = useCacheManager();

  // Setup polling for price updates
  useEffect(() => {
    const cleanup = cacheManager.realTime.setupPolling();
    return cleanup;
  }, [cacheManager]);

  const handleRealTimeUpdate = useCallback((
    type: 'portfolio' | 'position' | 'transaction',
    data: any
  ) => {
    switch (type) {
      case 'portfolio':
        cacheManager.realTime.handlePortfolioUpdate(data);
        break;
      case 'position':
        cacheManager.realTime.handlePositionUpdate(data);
        break;
      case 'transaction':
        cacheManager.realTime.handleTransactionUpdate(data);
        break;
    }
  }, [cacheManager]);

  return { handleRealTimeUpdate };
}

/**
 * Hook for intelligent cache invalidation
 */
export function useCacheInvalidation() {
  const cacheManager = useCacheManager();

  const invalidatePortfolioData = useCallback((portfolioId: string) => {
    cacheManager.invalidation.invalidatePortfolioData(portfolioId);
  }, [cacheManager]);

  const invalidatePositionData = useCallback((positionId: string, portfolioId: string) => {
    cacheManager.invalidation.invalidatePositionData(positionId, portfolioId);
  }, [cacheManager]);

  const invalidateTransactionData = useCallback((positionId: string, portfolioId?: string) => {
    cacheManager.invalidation.invalidateTransactionData(positionId, portfolioId);
  }, [cacheManager]);

  const invalidateForRealTime = useCallback((
    type: 'portfolio' | 'position' | 'transaction',
    id: string,
    portfolioId?: string
  ) => {
    cacheManager.invalidation.invalidateForRealTimeUpdate(type, id, portfolioId);
  }, [cacheManager]);

  return {
    invalidatePortfolioData,
    invalidatePositionData,
    invalidateTransactionData,
    invalidateForRealTime,
  };
}

/**
 * Hook for accessing cached data without triggering fetches
 */
export function useCachedData() {
  const cacheManager = useCacheManager();

  const getCachedPortfolios = useCallback(() => {
    return cacheManager.persistence.getCachedPortfolios();
  }, [cacheManager]);

  const getCachedPositions = useCallback((portfolioId: string) => {
    return cacheManager.persistence.getCachedPositions(portfolioId);
  }, [cacheManager]);

  const getCachedRecentTransactions = useCallback(() => {
    return cacheManager.persistence.getCachedRecentTransactions();
  }, [cacheManager]);

  const isDataCached = useCallback((queryKey: unknown[]) => {
    return cacheManager.persistence.isDataCached(queryKey);
  }, [cacheManager]);

  return {
    getCachedPortfolios,
    getCachedPositions,
    getCachedRecentTransactions,
    isDataCached,
  };
}

/**
 * Hook for optimistic updates
 */
export function useOptimisticUpdates() {
  const cacheManager = useCacheManager();

  const optimisticallyAddPortfolio = useCallback((portfolio: any) => {
    cacheManager.optimistic.optimisticallyAddPortfolio(portfolio);
  }, [cacheManager]);

  const optimisticallyUpdatePortfolio = useCallback((portfolio: any) => {
    cacheManager.optimistic.optimisticallyUpdatePortfolio(portfolio);
  }, [cacheManager]);

  const optimisticallyRemovePortfolio = useCallback((portfolioId: string) => {
    cacheManager.optimistic.optimisticallyRemovePortfolio(portfolioId);
  }, [cacheManager]);

  const optimisticallyAddPosition = useCallback((position: any) => {
    cacheManager.optimistic.optimisticallyAddPosition(position);
  }, [cacheManager]);

  const optimisticallyUpdatePosition = useCallback((position: any) => {
    cacheManager.optimistic.optimisticallyUpdatePosition(position);
  }, [cacheManager]);

  const optimisticallyRemovePosition = useCallback((positionId: string, portfolioId: string) => {
    cacheManager.optimistic.optimisticallyRemovePosition(positionId, portfolioId);
  }, [cacheManager]);

  const optimisticallyAddTransaction = useCallback((transaction: any) => {
    cacheManager.optimistic.optimisticallyAddTransaction(transaction);
  }, [cacheManager]);

  return {
    optimisticallyAddPortfolio,
    optimisticallyUpdatePortfolio,
    optimisticallyRemovePortfolio,
    optimisticallyAddPosition,
    optimisticallyUpdatePosition,
    optimisticallyRemovePosition,
    optimisticallyAddTransaction,
  };
}

/**
 * Hook for cache performance monitoring
 */
export function useCachePerformance() {
  const queryClient = useQueryClient();

  const getCacheStats = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      loadingQueries: queries.filter(q => q.state.status === 'pending').length,
    };
  }, [queryClient]);

  const clearStaleQueries = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const staleQueries = cache.getAll().filter(q => q.isStale());
    
    staleQueries.forEach(query => {
      queryClient.removeQueries({ queryKey: query.queryKey });
    });
    
    return staleQueries.length;
  }, [queryClient]);

  return {
    getCacheStats,
    clearStaleQueries,
  };
}