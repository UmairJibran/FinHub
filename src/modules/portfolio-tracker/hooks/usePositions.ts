/**
 * Custom hook for position management with TanStack Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CacheManager } from '../lib/cache-utils';
import {
  fetchPositionsByPortfolio,
  fetchPositionsWithMetrics,
  fetchPositionById,
  createPosition,
  updatePosition,
  deletePosition,
  fetchTransactionsByPosition,
  fetchRecentTransactions,
  isSymbolExistsInPortfolio,
  getPositionCount,
} from '../lib/position-service';
import type {
  Position,
  CreatePositionInput,
  UpdatePositionInput,
} from '../lib/types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const positionKeys = {
  all: ['positions'] as const,
  byPortfolio: (portfolioId: string) => [...positionKeys.all, 'portfolio', portfolioId] as const,
  withMetrics: (portfolioId: string) => [...positionKeys.byPortfolio(portfolioId), 'metrics'] as const,
  byId: (id: string) => [...positionKeys.all, 'detail', id] as const,
  transactions: (positionId: string) => [...positionKeys.all, 'transactions', positionId] as const,
  recentTransactions: () => [...positionKeys.all, 'recent-transactions'] as const,
  symbolExists: (portfolioId: string, symbol: string) => [...positionKeys.all, 'symbol-exists', portfolioId, symbol] as const,
  count: (portfolioId: string) => [...positionKeys.all, 'count', portfolioId] as const,
};

// ============================================================================
// POSITION QUERIES
// ============================================================================

/**
 * Hook to fetch positions for a specific portfolio
 */
export function usePositions(portfolioId: string) {
  return useQuery({
    queryKey: positionKeys.byPortfolio(portfolioId),
    queryFn: () => fetchPositionsByPortfolio(portfolioId),
    enabled: !!portfolioId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch positions with calculated metrics
 */
export function usePositionsWithMetrics(portfolioId: string) {
  return useQuery({
    queryKey: positionKeys.withMetrics(portfolioId),
    queryFn: () => fetchPositionsWithMetrics(portfolioId),
    enabled: !!portfolioId,
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter due to price changes)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single position by ID
 */
export function usePosition(id: string) {
  return useQuery({
    queryKey: positionKeys.byId(id),
    queryFn: () => fetchPositionById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch transactions for a position
 */
export function usePositionTransactions(positionId: string) {
  return useQuery({
    queryKey: positionKeys.transactions(positionId),
    queryFn: () => fetchTransactionsByPosition(positionId),
    enabled: !!positionId,
    staleTime: 10 * 60 * 1000, // 10 minutes (transactions don't change often)
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to fetch recent transactions across all portfolios
 */
export function useRecentTransactions(limit: number = 10) {
  return useQuery({
    queryKey: positionKeys.recentTransactions(),
    queryFn: () => fetchRecentTransactions(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to check if a symbol exists in a portfolio
 */
export function useSymbolExists(portfolioId: string, symbol: string, excludePositionId?: string) {
  return useQuery({
    queryKey: positionKeys.symbolExists(portfolioId, symbol),
    queryFn: () => isSymbolExistsInPortfolio(portfolioId, symbol, excludePositionId),
    enabled: !!portfolioId && !!symbol,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to get position count for a portfolio
 */
export function usePositionCount(portfolioId: string) {
  return useQuery({
    queryKey: positionKeys.count(portfolioId),
    queryFn: () => getPositionCount(portfolioId),
    enabled: !!portfolioId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================================================
// POSITION MUTATIONS
// ============================================================================

/**
 * Hook to create a new position
 */
export function useCreatePosition() {
  const queryClient = useQueryClient();
  const cacheManager = new CacheManager(queryClient);

  return useMutation({
    mutationFn: (input: CreatePositionInput) => createPosition(input),
    // Optimistic update
    onMutate: async (newPositionInput) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: positionKeys.byPortfolio(newPositionInput.portfolio_id) 
      });

      // Snapshot the previous value
      const previousPositions = queryClient.getQueryData<Position[]>(
        positionKeys.byPortfolio(newPositionInput.portfolio_id)
      );

      // Create optimistic position object
      const optimisticPosition: Position = {
        id: `temp-${Date.now()}`, // Temporary ID
        portfolio_id: newPositionInput.portfolio_id,
        symbol: newPositionInput.symbol,
        name: newPositionInput.name,
        quantity: newPositionInput.quantity,
        average_cost: newPositionInput.purchase_price,
        total_invested: newPositionInput.quantity * newPositionInput.purchase_price,
        current_price: newPositionInput.current_price,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistically update the cache
      cacheManager.optimistic.optimisticallyAddPosition(optimisticPosition);

      return { previousPositions };
    },
    onSuccess: (newPosition, variables, _context) => {
      // Replace optimistic update with real data
      cacheManager.optimistic.optimisticallyAddPosition(newPosition);
      
      // Invalidate related queries
      cacheManager.invalidation.invalidatePositionData(newPosition.id, variables.portfolio_id);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousPositions) {
        queryClient.setQueryData(
          positionKeys.byPortfolio(variables.portfolio_id), 
          context.previousPositions
        );
      }
    },
    // Always refetch after error or success
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: positionKeys.byPortfolio(variables.portfolio_id),
      });
    },
  });
}

/**
 * Hook to update an existing position
 */
export function useUpdatePosition() {
  const queryClient = useQueryClient();
  const cacheManager = new CacheManager(queryClient);

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePositionInput }) =>
      updatePosition(id, input),
    // Optimistic update
    onMutate: async ({ id, input }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: positionKeys.byId(id) });

      // Snapshot the previous value
      const previousPosition = queryClient.getQueryData<Position>(positionKeys.byId(id));

      // Create optimistic updated position
      if (previousPosition) {
        const optimisticPosition: Position = {
          ...previousPosition,
          ...input,
          updated_at: new Date().toISOString(),
        };

        // Optimistically update the cache
        cacheManager.optimistic.optimisticallyUpdatePosition(optimisticPosition);
      }

      return { previousPosition };
    },
    onSuccess: (updatedPosition, variables, _context) => {
      // Update with real data
      cacheManager.optimistic.optimisticallyUpdatePosition(updatedPosition);
      
      // Invalidate related queries
      cacheManager.invalidation.invalidatePositionData(variables.id, updatedPosition.portfolio_id);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousPosition) {
        queryClient.setQueryData(positionKeys.byId(variables.id), context.previousPosition);
      }
    },
    // Always refetch after error or success
    onSettled: (data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: positionKeys.byId(variables.id) });
      if (data) {
        queryClient.invalidateQueries({
          queryKey: positionKeys.byPortfolio(data.portfolio_id),
        });
      }
    },
  });
}

/**
 * Hook to delete a position
 */
export function useDeletePosition() {
  const queryClient = useQueryClient();
  const cacheManager = new CacheManager(queryClient);

  return useMutation({
    mutationFn: (id: string) => deletePosition(id),
    // Optimistic update
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: positionKeys.byId(deletedId) });

      // Snapshot the previous value
      const previousPosition = queryClient.getQueryData<Position>(positionKeys.byId(deletedId));

      // Optimistically remove the position
      if (previousPosition) {
        cacheManager.optimistic.optimisticallyRemovePosition(deletedId, previousPosition.portfolio_id);
      }

      return { previousPosition };
    },
    onSuccess: (_, deletedId, context) => {
      // Invalidate all related data
      if (context?.previousPosition) {
        cacheManager.invalidation.invalidatePositionData(deletedId, context.previousPosition.portfolio_id);
      }
    },
    onError: (error, deletedId, context) => {
      // Rollback optimistic update
      if (context?.previousPosition) {
        queryClient.setQueryData(positionKeys.byId(deletedId), context.previousPosition);
        cacheManager.optimistic.optimisticallyAddPosition(context.previousPosition);
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: positionKeys.all });
    },
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook that provides all position-related operations for a portfolio
 */
export function usePortfolioPositions(portfolioId: string) {
  const positions = usePositionsWithMetrics(portfolioId);
  const createMutation = useCreatePosition();
  const updateMutation = useUpdatePosition();
  const deleteMutation = useDeletePosition();
  const positionCount = usePositionCount(portfolioId);

  return {
    // Data
    positions: positions.data || [],
    isLoading: positions.isLoading,
    error: positions.error,
    positionCount: positionCount.data || 0,
    
    // Actions
    createPosition: createMutation.mutateAsync,
    updatePosition: updateMutation.mutateAsync,
    deletePosition: deleteMutation.mutateAsync,
    
    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Errors
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    
    // Refetch
    refetch: positions.refetch,
  };
}

/**
 * Hook for managing position form state and validation
 */
export function usePositionForm(portfolioId: string, position?: Position) {
  const symbolExists = useSymbolExists(
    portfolioId,
    '', // Will be set when form is filled
    position?.id
  );

  const validateSymbol = async (symbol: string): Promise<boolean> => {
    if (!symbol || symbol === position?.symbol) return true;
    
    try {
      const exists = await isSymbolExistsInPortfolio(portfolioId, symbol, position?.id);
      return !exists;
    } catch (error) {
      return true; // Allow on error to not block user
    }
  };

  return {
    validateSymbol,
    isValidatingSymbol: symbolExists.isLoading,
  };
}