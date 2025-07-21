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
  unknown
> {
  const queryClient = useQueryClient();
  const { handleError, handleSuccess } = useErrorHandler();

  return useMutation({
    mutationFn: createPortfolio,
    onSuccess: (newPortfolio) => {
      // Invalidate and refetch portfolio queries
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
      
      // Optimistically add the new portfolio to the cache
      queryClient.setQueryData<Portfolio[]>(
        portfolioKeys.lists(),
        (oldData) => {
          if (!oldData) return [newPortfolio];
          return [newPortfolio, ...oldData];
        }
      );

      handleSuccess('Portfolio created successfully');
    },
    onError: (error) => {
      console.error('Failed to create portfolio:', error);
      handleError(error, 'Failed to create portfolio');
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
  unknown
> {
  const queryClient = useQueryClient();
  const { handleError, handleSuccess } = useErrorHandler();

  return useMutation({
    mutationFn: ({ id, input }) => updatePortfolio(id, input),
    onSuccess: (updatedPortfolio, { id }) => {
      // Update the specific portfolio in cache
      queryClient.setQueryData<Portfolio>(
        portfolioKeys.detail(id),
        updatedPortfolio
      );

      // Update the portfolio in the list cache
      queryClient.setQueryData<Portfolio[]>(
        portfolioKeys.lists(),
        (oldData) => {
          if (!oldData) return [updatedPortfolio];
          return oldData.map(portfolio => 
            portfolio.id === id ? updatedPortfolio : portfolio
          );
        }
      );

      // Invalidate summaries to recalculate metrics
      queryClient.invalidateQueries({ queryKey: portfolioKeys.summaries() });
      
      handleSuccess('Portfolio updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update portfolio:', error);
      handleError(error, 'Failed to update portfolio');
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
  unknown
> {
  const queryClient = useQueryClient();
  const { handleError, handleSuccess } = useErrorHandler();

  return useMutation({
    mutationFn: deletePortfolio,
    onSuccess: (_, deletedId) => {
      // Remove the portfolio from cache
      queryClient.removeQueries({ queryKey: portfolioKeys.detail(deletedId) });

      // Remove from the list cache
      queryClient.setQueryData<Portfolio[]>(
        portfolioKeys.lists(),
        (oldData) => {
          if (!oldData) return [];
          return oldData.filter(portfolio => portfolio.id !== deletedId);
        }
      );

      // Invalidate summaries and count
      queryClient.invalidateQueries({ queryKey: portfolioKeys.summaries() });
      queryClient.invalidateQueries({ queryKey: portfolioKeys.count() });
      
      handleSuccess('Portfolio deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete portfolio:', error);
      handleError(error, 'Failed to delete portfolio');
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