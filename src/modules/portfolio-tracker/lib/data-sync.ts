/**
 * Data synchronization utilities for real-time updates and offline support
 */

import { QueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase/client';
import { CacheManager } from './cache-utils';
import type { Portfolio, Position, Transaction } from './types';

// ============================================================================
// REAL-TIME SUBSCRIPTION MANAGER
// ============================================================================

export class RealTimeSubscriptionManager {
  private subscriptions: Map<string, any> = new Map();
  private cacheManager: CacheManager;

  constructor(private _queryClient: QueryClient) {
    this.cacheManager = new CacheManager(_queryClient);
  }

  /**
   * Subscribe to portfolio changes
   */
  subscribeToPortfolios(userId: string) {
    const subscriptionKey = `portfolios-${userId}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      return; // Already subscribed
    }

    const subscription = supabase!
      .channel('portfolios')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolios',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          this.handlePortfolioChange(payload);
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
  }

  /**
   * Subscribe to position changes for a specific portfolio
   */
  subscribeToPositions(portfolioId: string) {
    const subscriptionKey = `positions-${portfolioId}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      return; // Already subscribed
    }

    const subscription = supabase!
      .channel(`positions-${portfolioId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'positions',
          filter: `portfolio_id=eq.${portfolioId}`,
        },
        (payload) => {
          this.handlePositionChange(payload, portfolioId);
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
  }

  /**
   * Subscribe to transaction changes
   */
  subscribeToTransactions(userId: string) {
    const subscriptionKey = `transactions-${userId}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      return; // Already subscribed
    }

    const subscription = supabase!
      .channel('transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          this.handleTransactionChange(payload);
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
  }

  /**
   * Handle portfolio changes from real-time subscription
   */
  private handlePortfolioChange(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        if (newRecord) {
          this.cacheManager.realTime.handlePortfolioUpdate(newRecord as Portfolio);
        }
        break;
      case 'UPDATE':
        if (newRecord) {
          this.cacheManager.realTime.handlePortfolioUpdate(newRecord as Portfolio);
        }
        break;
      case 'DELETE':
        if (oldRecord) {
          this.cacheManager.invalidation.invalidatePortfolioData(oldRecord.id);
        }
        break;
    }
  }

  /**
   * Handle position changes from real-time subscription
   */
  private handlePositionChange(payload: any, portfolioId: string) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        if (newRecord) {
          this.cacheManager.realTime.handlePositionUpdate(newRecord as Position);
        }
        break;
      case 'UPDATE':
        if (newRecord) {
          this.cacheManager.realTime.handlePositionUpdate(newRecord as Position);
        }
        break;
      case 'DELETE':
        if (oldRecord) {
          this.cacheManager.invalidation.invalidatePositionData(oldRecord.id, portfolioId);
        }
        break;
    }
  }

  /**
   * Handle transaction changes from real-time subscription
   */
  private handleTransactionChange(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        if (newRecord) {
          this.cacheManager.realTime.handleTransactionUpdate(newRecord as Transaction);
        }
        break;
      case 'UPDATE':
        if (newRecord) {
          this.cacheManager.realTime.handleTransactionUpdate(newRecord as Transaction);
        }
        break;
      case 'DELETE':
        if (oldRecord) {
          this.cacheManager.invalidation.invalidateTransactionData(oldRecord.position_id);
        }
        break;
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      supabase!.removeChannel(subscription);
    });
    this.subscriptions.clear();
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(key: string) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      supabase!.removeChannel(subscription);
      this.subscriptions.delete(key);
    }
  }
}

// ============================================================================
// OFFLINE SYNC MANAGER
// ============================================================================

export class OfflineSyncManager {
  private pendingOperations: Array<{
    id: string;
    type: 'create' | 'update' | 'delete';
    entity: 'portfolio' | 'position' | 'transaction';
    data: any;
    timestamp: number;
  }> = [];

  constructor(private queryClient: QueryClient) {
    this.loadPendingOperations();
    this.setupOnlineListener();
  }

  /**
   * Add an operation to the pending queue
   */
  addPendingOperation(
    type: 'create' | 'update' | 'delete',
    entity: 'portfolio' | 'position' | 'transaction',
    data: any
  ) {
    const operation = {
      id: `${type}-${entity}-${Date.now()}-${Math.random()}`,
      type,
      entity,
      data,
      timestamp: Date.now(),
    };

    this.pendingOperations.push(operation);
    this.savePendingOperations();
  }

  /**
   * Process pending operations when back online
   */
  async processPendingOperations() {
    if (typeof navigator === 'undefined' || !navigator.onLine || this.pendingOperations.length === 0) {
      return;
    }

    const operations = [...this.pendingOperations];
    this.pendingOperations = [];
    this.savePendingOperations();

    for (const operation of operations) {
      try {
        await this.executeOperation(operation);
      } catch (error) {
        // Re-add failed operation to queue
        this.pendingOperations.push(operation);
      }
    }

    this.savePendingOperations();
  }

  /**
   * Execute a pending operation
   */
  private async executeOperation(operation: any) {
    // This would integrate with your service layer
    // For now, we'll just invalidate the relevant queries
    switch (operation.entity) {
      case 'portfolio':
        this.queryClient.invalidateQueries({ queryKey: ['portfolios'] });
        break;
      case 'position':
        this.queryClient.invalidateQueries({ queryKey: ['positions'] });
        break;
      case 'transaction':
        this.queryClient.invalidateQueries({ queryKey: ['transactions'] });
        break;
    }
  }

  /**
   * Load pending operations from localStorage
   */
  private loadPendingOperations() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('portfolio-pending-operations');
        if (stored) {
          this.pendingOperations = JSON.parse(stored);
        }
      }
    } catch (error) {
      // Failed to load pending operations
    }
  }

  /**
   * Save pending operations to localStorage
   */
  private savePendingOperations() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          'portfolio-pending-operations',
          JSON.stringify(this.pendingOperations)
        );
      }
    } catch (error) {
      // Failed to save pending operations
    }
  }

  /**
   * Setup listener for online/offline events
   */
  private setupOnlineListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.processPendingOperations();
      });
    }
  }

  /**
   * Get pending operations count
   */
  getPendingCount() {
    return this.pendingOperations.length;
  }

  /**
   * Clear all pending operations
   */
  clearPendingOperations() {
    this.pendingOperations = [];
    this.savePendingOperations();
  }
}

// ============================================================================
// BACKGROUND SYNC MANAGER
// ============================================================================

export class BackgroundSyncManager {
  private syncInterval: NodeJS.Timeout | null = null;
  private _cacheManager: CacheManager;

  constructor(private queryClient: QueryClient) {
    this._cacheManager = new CacheManager(queryClient);
  }

  /**
   * Start background synchronization
   */
  startBackgroundSync(intervalMs: number = 5 * 60 * 1000) { // 5 minutes default
    if (this.syncInterval) {
      this.stopBackgroundSync();
    }

    this.syncInterval = setInterval(() => {
      this.performBackgroundSync();
    }, intervalMs);
  }

  /**
   * Stop background synchronization
   */
  stopBackgroundSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Perform background synchronization
   */
  private async performBackgroundSync() {
    // Only sync if user is active and online
    if (typeof document === 'undefined' || typeof navigator === 'undefined' || 
        document.visibilityState !== 'visible' || !navigator.onLine) {
      return;
    }

    try {
      // Invalidate stale data to trigger background refetch
      this.queryClient.invalidateQueries({
        queryKey: ['portfolios', 'summaries'],
        refetchType: 'active',
      });

      // Invalidate position metrics (prices may have changed)
      this.queryClient.invalidateQueries({
        queryKey: ['positions'],
        predicate: (query) => {
          return query.queryKey.includes('metrics');
        },
        refetchType: 'active',
      });
    } catch (error) {
      // Background sync failed
    }
  }
}

// ============================================================================
// MAIN DATA SYNC MANAGER
// ============================================================================

export class DataSyncManager {
  public realTime: RealTimeSubscriptionManager;
  public offline: OfflineSyncManager;
  public background: BackgroundSyncManager;

  constructor(queryClient: QueryClient) {
    this.realTime = new RealTimeSubscriptionManager(queryClient);
    this.offline = new OfflineSyncManager(queryClient);
    this.background = new BackgroundSyncManager(queryClient);
  }

  /**
   * Initialize all sync mechanisms
   */
  initialize(userId: string) {
    // Setup real-time subscriptions
    this.realTime.subscribeToPortfolios(userId);
    this.realTime.subscribeToTransactions(userId);

    // Start background sync
    this.background.startBackgroundSync();

    // Process any pending offline operations
    this.offline.processPendingOperations();
  }

  /**
   * Cleanup all sync mechanisms
   */
  cleanup() {
    this.realTime.unsubscribeAll();
    this.background.stopBackgroundSync();
  }

  /**
   * Subscribe to position changes for a specific portfolio
   */
  subscribeToPortfolioPositions(portfolioId: string) {
    this.realTime.subscribeToPositions(portfolioId);
  }

  /**
   * Unsubscribe from position changes for a specific portfolio
   */
  unsubscribeFromPortfolioPositions(portfolioId: string) {
    this.realTime.unsubscribe(`positions-${portfolioId}`);
  }
}