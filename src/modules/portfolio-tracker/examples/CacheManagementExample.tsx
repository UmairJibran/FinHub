/**
 * Example component demonstrating enhanced caching and data persistence features
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { 
  useRealTimeCacheUpdates,
  useCacheInvalidation,
  useCachedData,
  useOptimisticUpdates,
  useCachePerformance
} from '../hooks/useCacheManager';
import { 
  useDataSync, 
  usePortfolioDataSync, 
  useOfflineSyncStatus, 
  useConnectionStatus 
} from '../hooks/useDataSync';
import { usePortfolioManager } from '../hooks/usePortfolios';

export function CacheManagementExample() {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  
  // Cache management hooks
  const { handleRealTimeUpdate } = useRealTimeCacheUpdates();
  const cacheInvalidation = useCacheInvalidation();
  const cachedData = useCachedData();
  const optimisticUpdates = useOptimisticUpdates();
  const cachePerformance = useCachePerformance();
  
  // Data sync hooks
  const dataSync = useDataSync();
  const portfolioDataSync = usePortfolioDataSync(selectedPortfolioId);
  const offlineSync = useOfflineSyncStatus();
  const connectionStatus = useConnectionStatus();
  
  // Portfolio data
  const portfolioManager = usePortfolioManager();
  
  // Cache performance stats
  const cacheStats = cachePerformance.getCacheStats();
  
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Connection Status
              <Badge variant={connectionStatus.isOnline ? 'default' : 'destructive'}>
                {connectionStatus.isOnline ? 'Online' : 'Offline'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Real-time connection and sync status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <strong>Pending Operations:</strong> {offlineSync.getPendingOperationsCount()}
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={offlineSync.processPendingOperations}
                disabled={!connectionStatus.isOnline}
              >
                Sync Now
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={offlineSync.clearPendingOperations}
              >
                Clear Queue
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cache Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Cache Performance</CardTitle>
            <CardDescription>
              Query cache statistics and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Total Queries: {cacheStats.totalQueries}</div>
              <div>Active: {cacheStats.activeQueries}</div>
              <div>Stale: {cacheStats.staleQueries}</div>
              <div>Errors: {cacheStats.errorQueries}</div>
              <div>Loading: {cacheStats.loadingQueries}</div>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                const cleared = cachePerformance.clearStaleQueries();
                alert(`Cleared ${cleared} stale queries`);
              }}
            >
              Clear Stale
            </Button>
          </CardContent>
        </Card>

        {/* Cached Data Access */}
        <Card>
          <CardHeader>
            <CardTitle>Cached Data</CardTitle>
            <CardDescription>
              Access cached data without triggering fetches
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <strong>Cached Portfolios:</strong> {cachedData.getCachedPortfolios()?.length || 0}
            </div>
            <div className="text-sm">
              <strong>Recent Transactions:</strong> {cachedData.getCachedRecentTransactions()?.length || 0}
            </div>
            <Button 
              size="sm"
              onClick={() => {
                const portfolios = cachedData.getCachedPortfolios();
                console.log('Cached portfolios:', portfolios);
              }}
            >
              Log Cached Data
            </Button>
          </CardContent>
        </Card>

        {/* Cache Invalidation */}
        <Card>
          <CardHeader>
            <CardTitle>Cache Invalidation</CardTitle>
            <CardDescription>
              Manually invalidate cached data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-col gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  cacheInvalidation.invalidateForRealTime('portfolio', 'all');
                  alert('Portfolio cache invalidated');
                }}
              >
                Invalidate Portfolios
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  if (selectedPortfolioId) {
                    cacheInvalidation.invalidatePositionData('all', selectedPortfolioId);
                    alert('Position cache invalidated');
                  } else {
                    alert('Select a portfolio first');
                  }
                }}
              >
                Invalidate Positions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Optimistic Updates Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Optimistic Updates</CardTitle>
            <CardDescription>
              Demonstrate optimistic update functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              size="sm"
              onClick={() => {
                const mockPortfolio = {
                  id: `demo-${Date.now()}`,
                  user_id: 'demo-user',
                  name: 'Demo Portfolio',
                  description: 'Optimistic update demo',
                  asset_type: 'stocks' as const,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                
                optimisticUpdates.optimisticallyAddPortfolio(mockPortfolio);
                alert('Optimistic portfolio added (temporary)');
                
                // Remove after 3 seconds
                setTimeout(() => {
                  optimisticUpdates.optimisticallyRemovePortfolio(mockPortfolio.id);
                  alert('Optimistic portfolio removed');
                }, 3000);
              }}
            >
              Demo Optimistic Add
            </Button>
          </CardContent>
        </Card>

        {/* Real-time Updates */}
        <Card>
          <CardHeader>
            <CardTitle>Real-time Updates</CardTitle>
            <CardDescription>
              Simulate real-time data updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              size="sm"
              onClick={() => {
                const mockPortfolio = {
                  id: selectedPortfolioId || 'demo-portfolio',
                  user_id: 'demo-user',
                  name: 'Updated Portfolio',
                  description: 'Real-time update demo',
                  asset_type: 'stocks' as const,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                
                handleRealTimeUpdate('portfolio', mockPortfolio);
                alert('Real-time portfolio update simulated');
              }}
            >
              Simulate Update
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Selection</CardTitle>
          <CardDescription>
            Select a portfolio to demonstrate portfolio-specific caching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {portfolioManager.portfolios.map((portfolio) => (
              <Button
                key={portfolio.id}
                variant={selectedPortfolioId === portfolio.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPortfolioId(portfolio.id)}
              >
                {portfolio.name}
              </Button>
            ))}
          </div>
          {selectedPortfolioId && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Selected Portfolio:</strong> {selectedPortfolioId}
              </p>
              <p className="text-sm text-muted-foreground">
                Position data sync is now active for this portfolio
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle>Data Synchronization</CardTitle>
          <CardDescription>
            Real-time data sync and background update status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {dataSync ? '✓' : '✗'}
              </div>
              <div className="text-sm">Data Sync</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {portfolioDataSync ? '✓' : '✗'}
              </div>
              <div className="text-sm">Portfolio Sync</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {connectionStatus.isOnline ? '✓' : '✗'}
              </div>
              <div className="text-sm">Online Status</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CacheManagementExample;