/**
 * Cache utilities for intelligent data persistence and invalidation strategies
 */

import { QueryClient } from '@tanstack/react-query';
import { portfolioKeys } from '../hooks/usePortfolios';
import { positionKeys } from '../hooks/usePositions';
import { transactionKeys } from '../hooks/useTransactions';
import type { Portfolio, Position, Transaction } from './types';

// ============================================================================
// CACHE INVALIDATION STRATEGIES
// ============================================================================

/**
 * Intelligent cache invalidation based on data relationships
 */
export class CacheInvalidationManager {
  constructor(private queryClient: QueryClient) {}

  /**
   * Invalidate all portfolio-related data when a portfolio changes
   */
  invalidatePortfolioData(portfolioId: string) {
    // Invalidate portfolio-specific queries
    this.queryClient.invalidateQueries({ queryKey: portfolioKeys.detail(portfolioId) });
    this.queryClient.invalidateQueries({ queryKey: portfolioKeys.summaries() });
    
    // Invalidate related position data
    this.queryClient.invalidateQueries({ queryKey: positionKeys.byPortfolio(portfolioId) });
    this.queryClient.invalidateQueries({ queryKey: positionKeys.withMetrics(portfolioId) });
    this.queryClient.invalidateQueries({ queryKey: positionKeys.count(portfolioId) });
    
    // Invalidate related transaction data
    this.queryClient.invalidateQueries({ queryKey: transactionKeys.byPortfolio(portfolioId) });
  }

  /**
   * Invalidate position-related data when a position changes
   */
  invalidatePositionData(positionId: string, portfolioId: string) {
    // Invalidate position-specific queries
    this.queryClient.invalidateQueries({ queryKey: positionKeys.byId(positionId) });
    
    // Invalidate portfolio-level position data
    this.queryClient.invalidateQueries({ queryKey: positionKeys.byPortfolio(portfolioId) });
    this.queryClient.invalidateQueries({ queryKey: positionKeys.withMetrics(portfolioId) });
    this.queryClient.invalidateQueries({ queryKey: positionKeys.count(portfolioId) });
    
    // Invalidate portfolio summaries (affected by position changes)
    this.queryClient.invalidateQueries({ queryKey: portfolioKeys.summaries() });
    
    // Invalidate related transaction data
    this.queryClient.invalidateQueries({ queryKey: transactionKeys.byPosition(positionId) });
    this.queryClient.invalidateQueries({ queryKey: transactionKeys.byPortfolio(portfolioId) });
    this.queryClient.invalidateQueries({ queryKey: transactionKeys.recent(10) });
  }

  /**
   * Invalidate transaction-related data when a transaction changes
   */
  invalidateTransactionData(positionId: string, portfolioId?: string) {
    // Invalidate transaction queries
    this.queryClient.invalidateQueries({ queryKey: transactionKeys.byPosition(positionId) });
    this.queryClient.invalidateQueries({ queryKey: transactionKeys.recent(10) });
    this.queryClient.invalidateQueries({ queryKey: transactionKeys.stats() });
    
    if (portfolioId) {
      this.queryClient.invalidateQueries({ queryKey: transactionKeys.byPortfolio(portfolioId) });
    }
    
    // Invalidate position data (affected by transactions)
    this.queryClient.invalidateQueries({ queryKey: positionKeys.byId(positionId) });
    
    if (portfolioId) {
      this.queryClient.invalidateQueries({ queryKey: positionKeys.byPortfolio(portfolioId) });
      this.queryClient.invalidateQueries({ queryKey: positionKeys.withMetrics(portfolioId) });
      
      // Invalidate portfolio summaries
      this.queryClient.invalidateQueries({ queryKey: portfolioKeys.summaries() });
    }
  }

  /**
   * Selective invalidation for real-time updates
   */
  invalidateForRealTimeUpdate(type: 'portfolio' | 'position' | 'transaction', id: string, portfolioId?: string) {
    switch (type) {
      case 'portfolio':
        this.invalidatePortfolioData(id);
        break;
      case 'position':
        if (portfolioId) {
          this.invalidatePositionData(id, portfolioId);
        }
        break;
      case 'transaction':
        if (portfolioId) {
          this.invalidateTransactionData(id, portfolioId);
        }
        break;
    }
  }
}

// ============================================================================
// OPTIMISTIC UPDATE UTILITIES
// ============================================================================

/**
 * Optimistic update utilities for better user experience
 */
export class OptimisticUpdateManager {
  constructor(private queryClient: QueryClient) {}

  /**
   * Optimistically add a new portfolio to the cache
   */
  optimisticallyAddPortfolio(newPortfolio: Portfolio) {
    // Add to portfolio list
    this.queryClient.setQueryData<Portfolio[]>(
      portfolioKeys.lists(),
      (oldData) => {
        if (!oldData) return [newPortfolio];
        return [newPortfolio, ...oldData];
      }
    );

    // Add to individual portfolio cache
    this.queryClient.setQueryData(
      portfolioKeys.detail(newPortfolio.id),
      newPortfolio
    );

    // Update portfolio count
    this.queryClient.setQueryData<number>(
      portfolioKeys.count(),
      (oldCount) => (oldCount || 0) + 1
    );
  }

  /**
   * Optimistically update a portfolio in the cache
   */
  optimisticallyUpdatePortfolio(updatedPortfolio: Portfolio) {
    // Update in portfolio list
    this.queryClient.setQueryData<Portfolio[]>(
      portfolioKeys.lists(),
      (oldData) => {
        if (!oldData) return [updatedPortfolio];
        return oldData.map(portfolio => 
          portfolio.id === updatedPortfolio.id ? updatedPortfolio : portfolio
        );
      }
    );

    // Update individual portfolio cache
    this.queryClient.setQueryData(
      portfolioKeys.detail(updatedPortfolio.id),
      updatedPortfolio
    );
  }

  /**
   * Optimistically remove a portfolio from the cache
   */
  optimisticallyRemovePortfolio(portfolioId: string) {
    // Remove from portfolio list
    this.queryClient.setQueryData<Portfolio[]>(
      portfolioKeys.lists(),
      (oldData) => {
        if (!oldData) return [];
        return oldData.filter(portfolio => portfolio.id !== portfolioId);
      }
    );

    // Remove individual portfolio cache
    this.queryClient.removeQueries({ queryKey: portfolioKeys.detail(portfolioId) });

    // Update portfolio count
    this.queryClient.setQueryData<number>(
      portfolioKeys.count(),
      (oldCount) => Math.max((oldCount || 1) - 1, 0)
    );
  }

  /**
   * Optimistically add a new position to the cache
   */
  optimisticallyAddPosition(newPosition: Position) {
    // Add to position list for the portfolio
    this.queryClient.setQueryData<Position[]>(
      positionKeys.byPortfolio(newPosition.portfolio_id),
      (oldData) => {
        if (!oldData) return [newPosition];
        return [newPosition, ...oldData];
      }
    );

    // Add to individual position cache
    this.queryClient.setQueryData(
      positionKeys.byId(newPosition.id),
      newPosition
    );

    // Update position count
    this.queryClient.setQueryData<number>(
      positionKeys.count(newPosition.portfolio_id),
      (oldCount) => (oldCount || 0) + 1
    );
  }

  /**
   * Optimistically update a position in the cache
   */
  optimisticallyUpdatePosition(updatedPosition: Position) {
    // Update in position list
    this.queryClient.setQueryData<Position[]>(
      positionKeys.byPortfolio(updatedPosition.portfolio_id),
      (oldData) => {
        if (!oldData) return [updatedPosition];
        return oldData.map(position => 
          position.id === updatedPosition.id ? updatedPosition : position
        );
      }
    );

    // Update individual position cache
    this.queryClient.setQueryData(
      positionKeys.byId(updatedPosition.id),
      updatedPosition
    );
  }

  /**
   * Optimistically remove a position from the cache
   */
  optimisticallyRemovePosition(positionId: string, portfolioId: string) {
    // Remove from position list
    this.queryClient.setQueryData<Position[]>(
      positionKeys.byPortfolio(portfolioId),
      (oldData) => {
        if (!oldData) return [];
        return oldData.filter(position => position.id !== positionId);
      }
    );

    // Remove individual position cache
    this.queryClient.removeQueries({ queryKey: positionKeys.byId(positionId) });

    // Update position count
    this.queryClient.setQueryData<number>(
      positionKeys.count(portfolioId),
      (oldCount) => Math.max((oldCount || 1) - 1, 0)
    );
  }

  /**
   * Optimistically add a transaction to recent transactions
   */
  optimisticallyAddTransaction(newTransaction: Transaction) {
    // Add to recent transactions
    this.queryClient.setQueryData<Transaction[]>(
      transactionKeys.recent(10),
      (oldData) => {
        if (!oldData) return [newTransaction];
        return [newTransaction, ...oldData].slice(0, 10); // Keep only 10 most recent
      }
    );
  }
}

// ============================================================================
// CACHE PERSISTENCE UTILITIES
// ============================================================================

/**
 * Cache persistence utilities for offline support
 */
export class CachePersistenceManager {
  constructor(private queryClient: QueryClient) {}

  /**
   * Get cached data without triggering a fetch
   */
  getCachedPortfolios(): Portfolio[] | undefined {
    return this.queryClient.getQueryData(portfolioKeys.lists());
  }

  /**
   * Get cached positions for a portfolio
   */
  getCachedPositions(portfolioId: string): Position[] | undefined {
    return this.queryClient.getQueryData(positionKeys.byPortfolio(portfolioId));
  }

  /**
   * Get cached recent transactions
   */
  getCachedRecentTransactions(): Transaction[] | undefined {
    return this.queryClient.getQueryData(transactionKeys.recent(10));
  }

  /**
   * Check if data is available in cache
   */
  isDataCached(queryKey: unknown[]): boolean {
    const data = this.queryClient.getQueryData(queryKey);
    return data !== undefined;
  }

  /**
   * Prefetch critical data for better performance
   */
  async prefetchCriticalData(_userId: string) {
    try {
      // Prefetch portfolios
      await this.queryClient.prefetchQuery({
        queryKey: portfolioKeys.lists(),
        staleTime: 5 * 60 * 1000,
      });

      // Prefetch portfolio summaries
      await this.queryClient.prefetchQuery({
        queryKey: portfolioKeys.summaries(),
        staleTime: 2 * 60 * 1000,
      });

      // Prefetch recent transactions
      await this.queryClient.prefetchQuery({
        queryKey: transactionKeys.recent(10),
        staleTime: 2 * 60 * 1000,
      });
    } catch (error) {
      console.warn('Failed to prefetch critical data:', error);
    }
  }

  /**
   * Clear all cached data (useful for logout)
   */
  clearAllCache() {
    this.queryClient.clear();
  }

  /**
   * Clear specific user data
   */
  clearUserData() {
    this.queryClient.removeQueries({ queryKey: portfolioKeys.all });
    this.queryClient.removeQueries({ queryKey: positionKeys.all });
    this.queryClient.removeQueries({ queryKey: transactionKeys.all });
  }
}

// ============================================================================
// REAL-TIME UPDATE STRATEGIES
// ============================================================================

/**
 * Real-time update strategies for live data synchronization
 */
export class RealTimeUpdateManager {
  constructor(private queryClient: QueryClient) {}

  /**
   * Handle real-time portfolio updates
   */
  handlePortfolioUpdate(portfolio: Portfolio) {
    // Update the specific portfolio
    this.queryClient.setQueryData(
      portfolioKeys.detail(portfolio.id),
      portfolio
    );

    // Update in the portfolio list
    this.queryClient.setQueryData<Portfolio[]>(
      portfolioKeys.lists(),
      (oldData) => {
        if (!oldData) return [portfolio];
        return oldData.map(p => p.id === portfolio.id ? portfolio : p);
      }
    );

    // Invalidate summaries to recalculate
    this.queryClient.invalidateQueries({ queryKey: portfolioKeys.summaries() });
  }

  /**
   * Handle real-time position updates
   */
  handlePositionUpdate(position: Position) {
    // Update the specific position
    this.queryClient.setQueryData(
      positionKeys.byId(position.id),
      position
    );

    // Update in the position list
    this.queryClient.setQueryData<Position[]>(
      positionKeys.byPortfolio(position.portfolio_id),
      (oldData) => {
        if (!oldData) return [position];
        return oldData.map(p => p.id === position.id ? position : p);
      }
    );

    // Invalidate metrics to recalculate
    this.queryClient.invalidateQueries({ 
      queryKey: positionKeys.withMetrics(position.portfolio_id) 
    });
  }

  /**
   * Handle real-time transaction updates
   */
  handleTransactionUpdate(transaction: Transaction) {
    // Add to recent transactions
    this.queryClient.setQueryData<Transaction[]>(
      transactionKeys.recent(10),
      (oldData) => {
        if (!oldData) return [transaction];
        // Remove if exists and add to front
        const filtered = oldData.filter(t => t.id !== transaction.id);
        return [transaction, ...filtered].slice(0, 10);
      }
    );

    // Invalidate position-specific transactions
    this.queryClient.invalidateQueries({ 
      queryKey: transactionKeys.byPosition(transaction.position_id) 
    });
  }

  /**
   * Setup polling for critical data that changes frequently
   */
  setupPolling() {
    // Poll portfolio summaries every 5 minutes for price updates
    this.queryClient.invalidateQueries({ 
      queryKey: portfolioKeys.summaries(),
      refetchType: 'active'
    });

    // Set up interval for background updates
    const intervalId = setInterval(() => {
      // Only refetch if user is active and online
      if (document.visibilityState === 'visible' && navigator.onLine) {
        this.queryClient.invalidateQueries({ 
          queryKey: portfolioKeys.summaries(),
          refetchType: 'active'
        });
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }
}

// ============================================================================
// MAIN CACHE MANAGER
// ============================================================================

/**
 * Main cache manager that combines all caching strategies
 */
export class CacheManager {
  public invalidation: CacheInvalidationManager;
  public optimistic: OptimisticUpdateManager;
  public persistence: CachePersistenceManager;
  public realTime: RealTimeUpdateManager;

  constructor(queryClient: QueryClient) {
    this.invalidation = new CacheInvalidationManager(queryClient);
    this.optimistic = new OptimisticUpdateManager(queryClient);
    this.persistence = new CachePersistenceManager(queryClient);
    this.realTime = new RealTimeUpdateManager(queryClient);
  }
}

// ============================================================================
// CACHE HOOKS
// ============================================================================

/**
 * Hook to access cache manager
 */
export function useCacheManager() {
  const queryClient = new QueryClient();
  return new CacheManager(queryClient);
}