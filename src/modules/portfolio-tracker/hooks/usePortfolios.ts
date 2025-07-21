/**
 * Custom hooks for portfolio data management with TanStack Query
 */

import { useEffect } from 'react';
import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult 
} from '@tanstack/react-query';
import { useErrorHandler } from '../../../lib/error-handling';
import { CacheManager } from '../lib/cache-utils';
import { 
  fetchPortfolios,
  fetchPortfolioSummaries,
  fetchPortfolioById,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  isPortfolioNameUnique,
  getPortfolioCount
} from '../lib/portfolio-service';
import type { 
  Portfolio, 
  PortfolioSummary,
  CreatePortfolioInput,
  UpdatePortfolioInput 
} from '../lib/types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const portfolioKeys = {
  all: ['portfolios'] as const,
  lists: () => [...portfolioKeys.all, 'list'] as const,
  list: (filters: string) => [...portfolioKeys.lists(), { filters }] as const,
  details: () => [...portfolioKeys.all, 'detail'] as const,
  detail: (id: string) => [...portfolioKeys.details(), id] as const,
  summaries: () => [...portfolioKeys.all, 'summaries'] as const,
  count: () => [...portfolioKeys.all, 'count'] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch all portfolios for the authenticated user
 */
export function usePortfolios(): UseQueryResult<Portfolio[], Error> {
  return useQuery({
    queryKey: portfolioKeys.lists(),
    queryFn: fetchPortfolios,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

/**
 * Hook to fetch portfolio summaries with calculated metrics
 */
export function usePortfolioSummaries(): UseQueryResult<PortfolioSummary[], Error> {
  return useQuery({
    queryKey: portfolioKeys.summaries(),
    queryFn: fetchPortfolioSummaries,
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter for summaries with calculations)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

/**
 * Hook to fetch a single portfolio by ID
 */
export function usePortfolio(id: string): UseQueryResult<Portfolio | null, Error> {
  return useQuery({
    queryKey: portfolioKeys.detail(id),
    queryFn: () => fetchPortfolioById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

/**
 * Hook to get portfolio count
 */
export function usePortfolioCount(): UseQueryResult<number, Error> {
  return useQuery({
    queryKey: portfolioKeys.count(),
    queryFn: getPortfolioCount,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to create a new portfolio
 */
export function useCreatePortfolio(): UseMutationResult<
  Portfolio,
  Error,
  CreatePortfolioInput,
  { previousPortfolios?: Portfolio[] }
> {
  const queryClient = useQueryClient();
  const { handleError, handleSuccess } = useErrorHandler();
  const cacheManager = new CacheManager(queryClient);

  return useMutation({
    mutationFn: createPortfolio,
    // Optimistic update
    onMutate: async (newPortfolioInput) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: portfolioKeys.lists() });

      // Snapshot the previous value
      const previousPortfolios = queryClient.getQueryData<Portfolio[]>(portfolioKeys.lists());

      // Create optimistic portfolio object
      const optimisticPortfolio: Portfolio = {
        id: `temp-${Date.now()}`, // Temporary ID
        user_id: '', // Will be set by server
        name: newPortfolioInput.name,
        description: newPortfolioInput.description,
        asset_type: newPortfolioInput.asset_type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistically update the cache
      cacheManager.optimistic.optimisticallyAddPortfolio(optimisticPortfolio);

      return { previousPortfolios };
    },
    onSuccess: (newPortfolio, _variables, _context) => {
      // Replace optimistic update with real data
      cacheManager.optimistic.optimisticallyAddPortfolio(newPortfolio);
      
      // Invalidate related queries
      cacheManager.invalidation.invalidatePortfolioData(newPortfolio.id);

      handleSuccess('Portfolio created successfully');
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic update
      if (context?.previousPortfolios) {
        queryClient.setQueryData(portfolioKeys.lists(), context.previousPortfolios);
      }
      
      console.error('Failed to create portfolio:', error);
      handleError(error, 'Failed to create portfolio');
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
  });
}

/**
 * Hook to update an existing portfolio
 */
export function useUpdatePortfolio(): UseMutationResult<
  Portfolio,
  Error,
  { id: string; input: UpdatePortfolioInput },
  { previousPortfolio?: Portfolio; previousPortfolios?: Portfolio[] }
> {
  const queryClient = useQueryClient();
  const { handleError, handleSuccess } = useErrorHandler();
  const cacheManager = new CacheManager(queryClient);

  return useMutation({
    mutationFn: ({ id, input }) => updatePortfolio(id, input),
    // Optimistic update
    onMutate: async ({ id, input }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: portfolioKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: portfolioKeys.lists() });

      // Snapshot the previous values
      const previousPortfolio = queryClient.getQueryData<Portfolio>(portfolioKeys.detail(id));
      const previousPortfolios = queryClient.getQueryData<Portfolio[]>(portfolioKeys.lists());

      // Create optimistic updated portfolio
      if (previousPortfolio) {
        const optimisticPortfolio: Portfolio = {
          ...previousPortfolio,
          ...input,
          updated_at: new Date().toISOString(),
        };

        // Optimistically update the cache
        cacheManager.optimistic.optimisticallyUpdatePortfolio(optimisticPortfolio);
      }

      return { previousPortfolio, previousPortfolios };
    },
    onSuccess: (updatedPortfolio, { id }, _context) => {
      // Update with real data
      cacheManager.optimistic.optimisticallyUpdatePortfolio(updatedPortfolio);
      
      // Invalidate related queries
      cacheManager.invalidation.invalidatePortfolioData(id);
      
      handleSuccess('Portfolio updated successfully');
    },
    onError: (error, { id }, context) => {
      // Rollback optimistic updates
      if (context?.previousPortfolio) {
        queryClient.setQueryData(portfolioKeys.detail(id), context.previousPortfolio);
      }
      if (context?.previousPortfolios) {
        queryClient.setQueryData(portfolioKeys.lists(), context.previousPortfolios);
      }
      
      console.error('Failed to update portfolio:', error);
      handleError(error, 'Failed to update portfolio');
    },
    // Always refetch after error or success
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: portfolioKeys.summaries() });
    },
  });
}

/**
 * Hook to delete a portfolio
 */
export function useDeletePortfolio(): UseMutationResult<
  void,
  Error,
  string,
  { previousPortfolio?: Portfolio; previousPortfolios?: Portfolio[] }
> {
  const queryClient = useQueryClient();
  const { handleError, handleSuccess } = useErrorHandler();
  const cacheManager = new CacheManager(queryClient);

  return useMutation({
    mutationFn: deletePortfolio,
    // Optimistic update
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: portfolioKeys.detail(deletedId) });
      await queryClient.cancelQueries({ queryKey: portfolioKeys.lists() });

      // Snapshot the previous values
      const previousPortfolio = queryClient.getQueryData<Portfolio>(portfolioKeys.detail(deletedId));
      const previousPortfolios = queryClient.getQueryData<Portfolio[]>(portfolioKeys.lists());

      // Optimistically remove the portfolio
      cacheManager.optimistic.optimisticallyRemovePortfolio(deletedId);

      return { previousPortfolio, previousPortfolios };
    },
    onSuccess: (_, deletedId, _context) => {
      // Invalidate all related data
      cacheManager.invalidation.invalidatePortfolioData(deletedId);
      
      handleSuccess('Portfolio deleted successfully');
    },
    onError: (error, deletedId, context) => {
      // Rollback optimistic updates
      if (context?.previousPortfolio) {
        queryClient.setQueryData(portfolioKeys.detail(deletedId), context.previousPortfolio);
      }
      if (context?.previousPortfolios) {
        queryClient.setQueryData(portfolioKeys.lists(), context.previousPortfolios);
      }
      
      console.error('Failed to delete portfolio:', error);
      handleError(error, 'Failed to delete portfolio');
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to check if a portfolio name is unique
 */
export function usePortfolioNameUnique(
  name: string, 
  excludeId?: string
): UseQueryResult<boolean, Error> {
  return useQuery({
    queryKey: ['portfolio-name-unique', name, excludeId],
    queryFn: () => isPortfolioNameUnique(name, excludeId),
    enabled: !!name && name.trim().length > 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to prefetch a portfolio by ID
 */
export function usePrefetchPortfolio() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: portfolioKeys.detail(id),
      queryFn: () => fetchPortfolioById(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
}

/**
 * Hook to invalidate all portfolio queries
 */
export function useInvalidatePortfolios() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
  };
}

// ============================================================================
// COMBINED HOOKS
// ============================================================================

/**
 * Hook that provides all portfolio-related data and operations
 */
export function usePortfolioManager() {
  const portfolios = usePortfolios();
  const summaries = usePortfolioSummaries();
  const count = usePortfolioCount();
  const createMutation = useCreatePortfolio();
  const updateMutation = useUpdatePortfolio();
  const deleteMutation = useDeletePortfolio();
  const prefetchPortfolio = usePrefetchPortfolio();
  const invalidatePortfolios = useInvalidatePortfolios();

  // Handle retry logic for failed queries
  useEffect(() => {
    if (portfolios.error || summaries.error || count.error) {
      console.log('Detected error in portfolio queries, scheduling retry');
      const retryTimeout = setTimeout(() => {
        console.log('Retrying portfolio queries');
        if (portfolios.error) portfolios.refetch();
        if (summaries.error) summaries.refetch();
        if (count.error) count.refetch();
      }, 5000); // Retry after 5 seconds
      
      return () => clearTimeout(retryTimeout);
    }
  }, [portfolios.error, summaries.error, count.error]);

  return {
    // Data
    portfolios: portfolios.data || [],
    summaries: summaries.data || [],
    count: count.data || 0,
    
    // Loading states
    isLoading: portfolios.isLoading || summaries.isLoading || count.isLoading,
    isLoadingPortfolios: portfolios.isLoading,
    isLoadingSummaries: summaries.isLoading,
    isLoadingCount: count.isLoading,
    
    // Error states
    error: portfolios.error || summaries.error || count.error,
    portfoliosError: portfolios.error,
    summariesError: summaries.error,
    countError: count.error,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Mutation errors
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    
    // Operations
    createPortfolio: createMutation.mutate,
    updatePortfolio: updateMutation.mutate,
    deletePortfolio: deleteMutation.mutate,
    prefetchPortfolio,
    invalidatePortfolios,
    
    // Refetch functions
    refetchPortfolios: portfolios.refetch,
    refetchSummaries: summaries.refetch,
    refetchCount: count.refetch,
  };
}