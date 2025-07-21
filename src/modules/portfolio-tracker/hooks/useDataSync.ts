/**
 * Hook for managing data synchronization and real-time updates
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import { DataSyncManager } from '../lib/data-sync';

/**
 * Hook for managing data synchronization lifecycle
 */
export function useDataSync() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const dataSyncRef = useRef<DataSyncManager | null>(null);

  // Initialize data sync when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !dataSyncRef.current) {
      dataSyncRef.current = new DataSyncManager(queryClient);
      dataSyncRef.current.initialize(user.id);
    }

    // Cleanup when user logs out
    if (!isAuthenticated && dataSyncRef.current) {
      dataSyncRef.current.cleanup();
      dataSyncRef.current = null;
    }

    // Cleanup on unmount
    return () => {
      if (dataSyncRef.current) {
        dataSyncRef.current.cleanup();
        dataSyncRef.current = null;
      }
    };
  }, [isAuthenticated, user, queryClient]);

  return dataSyncRef.current;
}

/**
 * Hook for managing portfolio-specific data sync
 */
export function usePortfolioDataSync(portfolioId: string | undefined) {
  const dataSync = useDataSync();

  useEffect(() => {
    if (dataSync && portfolioId) {
      // Subscribe to position changes for this portfolio
      dataSync.subscribeToPortfolioPositions(portfolioId);

      // Cleanup subscription when portfolio changes or component unmounts
      return () => {
        dataSync.unsubscribeFromPortfolioPositions(portfolioId);
      };
    }
  }, [dataSync, portfolioId]);

  return dataSync;
}

/**
 * Hook for monitoring offline sync status
 */
export function useOfflineSyncStatus() {
  const dataSync = useDataSync();

  const getPendingOperationsCount = () => {
    return dataSync?.offline.getPendingCount() || 0;
  };

  const clearPendingOperations = () => {
    dataSync?.offline.clearPendingOperations();
  };

  const processPendingOperations = async () => {
    await dataSync?.offline.processPendingOperations();
  };

  return {
    getPendingOperationsCount,
    clearPendingOperations,
    processPendingOperations,
    isOnline: navigator.onLine,
  };
}

/**
 * Hook for managing connection status and sync state
 */
export function useConnectionStatus() {
  const { isOnline } = useOfflineSyncStatus();

  useEffect(() => {
    const handleOnline = () => {
      console.log('Connection restored, processing pending operations...');
    };

    const handleOffline = () => {
      console.log('Connection lost, operations will be queued...');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}