/**
 * Custom hook for managing transaction data with TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTransactions,
  fetchTransactionsByPosition,
  fetchTransactionsByPortfolio,
  fetchRecentTransactions,
  fetchTransactionById,
  createTransaction,
  deleteTransaction,
  getTransactionStats,
  type TransactionQueryParams,
  type TransactionWithDetails,
} from '../lib/transaction-service';
import type { CreateTransactionInput } from '../lib/types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (params: TransactionQueryParams) => [...transactionKeys.lists(), params] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
  byPosition: (positionId: string) => [...transactionKeys.all, 'position', positionId] as const,
  byPortfolio: (portfolioId: string) => [...transactionKeys.all, 'portfolio', portfolioId] as const,
  recent: (limit: number) => [...transactionKeys.all, 'recent', limit] as const,
  stats: () => [...transactionKeys.all, 'stats'] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch transactions with filtering and pagination
 */
export function useTransactions(params: TransactionQueryParams = {}) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => fetchTransactions(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true,
  });
}

/**
 * Hook to fetch transactions for a specific position
 */
export function useTransactionsByPosition(positionId: string) {
  return useQuery({
    queryKey: transactionKeys.byPosition(positionId),
    queryFn: () => fetchTransactionsByPosition(positionId),
    enabled: !!positionId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch transactions for a specific portfolio
 */
export function useTransactionsByPortfolio(portfolioId: string) {
  return useQuery({
    queryKey: transactionKeys.byPortfolio(portfolioId),
    queryFn: () => fetchTransactionsByPortfolio(portfolioId),
    enabled: !!portfolioId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch recent transactions
 */
export function useRecentTransactions(limit: number = 10) {
  return useQuery({
    queryKey: transactionKeys.recent(limit),
    queryFn: () => fetchRecentTransactions(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes for recent data
    cacheTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single transaction by ID
 */
export function useTransaction(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => fetchTransactionById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch transaction statistics
 */
export function useTransactionStats() {
  return useQuery({
    queryKey: transactionKeys.stats(),
    queryFn: getTransactionStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 15 * 60 * 1000,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to create a new transaction
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: (newTransaction) => {
      // Invalidate and refetch transaction lists
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.recent(10) });
      queryClient.invalidateQueries({ queryKey: transactionKeys.stats() });
      
      // Invalidate position-specific and portfolio-specific queries
      queryClient.invalidateQueries({ 
        queryKey: transactionKeys.byPosition(newTransaction.position_id) 
      });
      
      // We don't have portfolio_id directly, so invalidate all portfolio queries
      queryClient.invalidateQueries({ 
        queryKey: ['transactions', 'portfolio'] 
      });

      // Also invalidate position and portfolio data since transactions affect them
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
    onError: (error) => {
      console.error('Failed to create transaction:', error);
    },
  });
}

/**
 * Hook to delete a transaction
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: (_, deletedId) => {
      // Remove the deleted transaction from cache
      queryClient.removeQueries({ queryKey: transactionKeys.detail(deletedId) });
      
      // Invalidate all transaction lists
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.recent(10) });
      queryClient.invalidateQueries({ queryKey: transactionKeys.stats() });
      
      // Invalidate all position and portfolio specific queries
      queryClient.invalidateQueries({ 
        queryKey: ['transactions', 'position'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['transactions', 'portfolio'] 
      });

      // Also invalidate position and portfolio data
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
    onError: (error) => {
      console.error('Failed to delete transaction:', error);
    },
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to prefetch transactions for a position
 */
export function usePrefetchTransactionsByPosition() {
  const queryClient = useQueryClient();

  return (positionId: string) => {
    queryClient.prefetchQuery({
      queryKey: transactionKeys.byPosition(positionId),
      queryFn: () => fetchTransactionsByPosition(positionId),
      staleTime: 5 * 60 * 1000,
    });
  };
}

/**
 * Hook to prefetch transactions for a portfolio
 */
export function usePrefetchTransactionsByPortfolio() {
  const queryClient = useQueryClient();

  return (portfolioId: string) => {
    queryClient.prefetchQuery({
      queryKey: transactionKeys.byPortfolio(portfolioId),
      queryFn: () => fetchTransactionsByPortfolio(portfolioId),
      staleTime: 5 * 60 * 1000,
    });
  };
}

/**
 * Hook to get cached transaction data without triggering a fetch
 */
export function useCachedTransactions(params: TransactionQueryParams = {}) {
  const queryClient = useQueryClient();
  
  return queryClient.getQueryData(transactionKeys.list(params));
}

/**
 * Hook to manually invalidate transaction queries
 */
export function useInvalidateTransactions() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
    invalidateByPosition: (positionId: string) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.byPosition(positionId) });
    },
    invalidateByPortfolio: (portfolioId: string) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.byPortfolio(portfolioId) });
    },
    invalidateRecent: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', 'recent'] });
    },
    invalidateStats: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.stats() });
    },
  };
}