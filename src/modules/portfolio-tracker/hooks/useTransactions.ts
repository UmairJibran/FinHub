/**
 * Custom hook for managing transaction data with TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CacheManager } from '../lib/cache-utils';
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
} from '../lib/transaction-service';
import type { Transaction } from '../lib/types';

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
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
    placeholderData: (previousData) => previousData, // Replaces keepPreviousData in v5
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
    gcTime: 10 * 60 * 1000,
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
    gcTime: 10 * 60 * 1000,
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
    gcTime: 5 * 60 * 1000,
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
    gcTime: 10 * 60 * 1000,
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
    gcTime: 15 * 60 * 1000,
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
  const cacheManager = new CacheManager(queryClient);

  return useMutation({
    mutationFn: (input: any) => createTransaction(input),
    // Optimistic update
    onMutate: async (newTransactionInput) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: transactionKeys.recent(10) });

      // Snapshot the previous value
      const previousRecentTransactions = queryClient.getQueryData<Transaction[]>(
        transactionKeys.recent(10)
      );

      // Create optimistic transaction object
      const optimisticTransaction: Transaction = {
        id: `temp-${Date.now()}`, // Temporary ID
        position_id: newTransactionInput.position_id,
        type: newTransactionInput.type as any,
        quantity: newTransactionInput.quantity,
        price: newTransactionInput.price,
        transaction_date: newTransactionInput.transaction_date || new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      // Optimistically update the cache
      cacheManager.optimistic.optimisticallyAddTransaction(optimisticTransaction);

      return { previousRecentTransactions };
    },
    onSuccess: (newTransaction, _variables, _context) => {
      // Replace optimistic update with real data
      cacheManager.optimistic.optimisticallyAddTransaction(newTransaction);
      
      // Invalidate related queries
      cacheManager.invalidation.invalidateTransactionData(newTransaction.position_id);
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic update
      if (context?.previousRecentTransactions) {
        queryClient.setQueryData(
          transactionKeys.recent(10), 
          context.previousRecentTransactions
        );
      }
    },
    // Always refetch after error or success
    onSettled: (_data, _error, _variables) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.stats() });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}

/**
 * Hook to delete a transaction
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const cacheManager = new CacheManager(queryClient);

  return useMutation({
    mutationFn: deleteTransaction,
    // Optimistic update
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: transactionKeys.detail(deletedId) });
      await queryClient.cancelQueries({ queryKey: transactionKeys.recent(10) });

      // Snapshot the previous values
      const previousTransaction = queryClient.getQueryData<Transaction>(
        transactionKeys.detail(deletedId)
      );
      const previousRecentTransactions = queryClient.getQueryData<Transaction[]>(
        transactionKeys.recent(10)
      );

      // Optimistically remove the transaction from recent transactions
      if (previousRecentTransactions) {
        const updatedRecentTransactions = previousRecentTransactions.filter(
          t => t.id !== deletedId
        );
        queryClient.setQueryData(transactionKeys.recent(10), updatedRecentTransactions);
      }

      // Remove from cache
      queryClient.removeQueries({ queryKey: transactionKeys.detail(deletedId) });

      return { previousTransaction, previousRecentTransactions };
    },
    onSuccess: (_, _deletedId, context) => {
      // Invalidate all related data
      if (context?.previousTransaction) {
        cacheManager.invalidation.invalidateTransactionData(context.previousTransaction.position_id);
      }
    },
    onError: (error, deletedId, context) => {
      // Rollback optimistic updates
      if (context?.previousTransaction) {
        queryClient.setQueryData(transactionKeys.detail(deletedId), context.previousTransaction);
      }
      if (context?.previousRecentTransactions) {
        queryClient.setQueryData(transactionKeys.recent(10), context.previousRecentTransactions);
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
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