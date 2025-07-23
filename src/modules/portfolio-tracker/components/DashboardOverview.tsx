/**
 * Dashboard Overview Component
 * Main dashboard with portfolio summaries and key metrics
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Activity,
} from 'lucide-react';
import { usePortfolioSummaries } from '../hooks/usePortfolios';
import { useRecentTransactions } from '../hooks/useTransactions';
import { AssetTypeLabels, TransactionType } from '../lib/types';
import type { PortfolioSummary, Transaction } from '../lib/types';
import {
  formatCurrency,
  getUserPreferredCurrency,
} from '@/lib/currency-config';
import { useAuth } from '@/hooks/useAuth';

interface DashboardMetrics {
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  portfolioCount: number;
}

function calculateDashboardMetrics(
  summaries: PortfolioSummary[]
): DashboardMetrics {
  const totalInvested = summaries.reduce(
    (sum, portfolio) => sum + portfolio.total_invested,
    0
  );
  const totalValue = summaries.reduce(
    (sum, portfolio) =>
      sum + (portfolio.current_value || portfolio.total_invested),
    0
  );
  const totalGainLoss = totalValue - totalInvested;
  const totalGainLossPercentage =
    totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  return {
    totalValue,
    totalInvested,
    totalGainLoss,
    totalGainLossPercentage,
    portfolioCount: summaries.length,
  };
}

function formatPercentage(percentage: number): string {
  return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
}

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

function MetricCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
}: MetricCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getChangeIcon = () => {
    if (changeType === 'positive') return <TrendingUp className="h-3 w-3" />;
    if (changeType === 'negative') return <TrendingDown className="h-3 w-3" />;
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div
            className={`flex items-center gap-1 text-xs ${getChangeColor()}`}
          >
            {getChangeIcon()}
            <span>{change}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PortfolioSummaryCardProps {
  portfolio: PortfolioSummary;
  onClick?: () => void;
  preferredCurrency: string;
}

function PortfolioSummaryCard({
  portfolio,
  onClick,
  preferredCurrency,
}: PortfolioSummaryCardProps) {
  const hasCurrentValue = portfolio.current_value !== undefined;
  const gainLoss = portfolio.unrealized_gain_loss || 0;
  const gainLossPercentage = portfolio.unrealized_gain_loss_percentage || 0;
  const isPositive = gainLoss >= 0;

  return (
    <Card
      className={`transition-colors ${
        onClick ? 'cursor-pointer hover:bg-muted/50' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{portfolio.name}</CardTitle>
          <Badge variant="secondary">
            {AssetTypeLabels[portfolio.asset_type]}
          </Badge>
        </div>
        {portfolio.description && (
          <p className="text-sm text-muted-foreground">
            {portfolio.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Total Invested
            </span>
            <span className="font-medium">
              {formatCurrency(portfolio.total_invested, {
                currency: preferredCurrency,
              })}
            </span>
          </div>

          {hasCurrentValue && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Current Value
              </span>
              <span className="font-medium">
                {formatCurrency(portfolio.current_value!, {
                  currency: preferredCurrency,
                })}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Positions</span>
            <span className="font-medium">{portfolio.total_positions}</span>
          </div>

          {hasCurrentValue && (
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                Unrealized P&L
              </span>
              <div className="text-right">
                <div
                  className={`font-medium ${
                    isPositive
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatCurrency(gainLoss, { currency: preferredCurrency })}
                </div>
                <div
                  className={`text-xs ${
                    isPositive
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatPercentage(gainLossPercentage)}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardOverview() {
  const {
    data: summaries = [],
    isLoading: isLoadingSummaries,
    error: summariesError,
  } = usePortfolioSummaries();
  const { data: recentTransactions = [], isLoading: isLoadingTransactions } =
    useRecentTransactions(5);
  const { profile, refreshUser } = useAuth();
  
  // Refresh user data on component mount to ensure we have the latest currency preferences
  React.useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Get the user's preferred currency and locale
  const preferredCurrency =
    profile?.preferred_currency || getUserPreferredCurrency();

  if (isLoadingSummaries) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (summariesError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              Failed to load dashboard data
            </p>
            <p className="text-sm text-red-600 mt-2">
              {summariesError.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = calculateDashboardMetrics(summaries);
  const hasData = summaries.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <PieChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Portfolios Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first portfolio to start tracking your investments
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Portfolio Value"
          value={formatCurrency(metrics.totalValue, {
            currency: preferredCurrency,
          })}
          change={formatPercentage(metrics.totalGainLossPercentage)}
          changeType={metrics.totalGainLoss >= 0 ? 'positive' : 'negative'}
          icon={DollarSign}
        />
        <MetricCard
          title="Total Invested"
          value={formatCurrency(metrics.totalInvested, {
            currency: preferredCurrency,
          })}
          icon={TrendingUp}
        />
        <MetricCard
          title="Unrealized P&L"
          value={formatCurrency(metrics.totalGainLoss, {
            currency: preferredCurrency,
          })}
          changeType={metrics.totalGainLoss >= 0 ? 'positive' : 'negative'}
          icon={metrics.totalGainLoss >= 0 ? TrendingUp : TrendingDown}
        />
        <MetricCard
          title="Active Portfolios"
          value={metrics.portfolioCount.toString()}
          icon={PieChart}
        />
      </div>

      {/* Portfolio Summaries */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Portfolio Overview</h2>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {summaries.map((portfolio) => (
            <PortfolioSummaryCard
              key={portfolio.id}
              portfolio={portfolio}
              onClick={() => {
                // Navigate to portfolio detail - will be handled by parent component
                window.location.href = `/portfolios/${portfolio.id}`;
              }}
              preferredCurrency={preferredCurrency}
            />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {(recentTransactions as Transaction[]).length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Latest Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-3 bg-muted/50 rounded"
                    >
                      <div className="space-y-1">
                        <div className="h-4 bg-muted rounded animate-pulse w-32" />
                        <div className="h-3 bg-muted rounded animate-pulse w-24" />
                      </div>
                      <div className="h-4 bg-muted rounded animate-pulse w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {(recentTransactions as Transaction[])
                    .slice(0, 5)
                    .map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-center p-3 bg-muted/50 rounded"
                      >
                        <div>
                          <p className="font-medium">
                            {transaction.type === TransactionType.BUY
                              ? 'Bought'
                              : 'Sold'}{' '}
                            {transaction.quantity} shares
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(
                              transaction.transaction_date
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div
                          className={`font-medium ${
                            transaction.type === TransactionType.BUY
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {transaction.type === TransactionType.BUY ? '+' : '-'}
                          {formatCurrency(
                            transaction.quantity * transaction.price,
                            { currency: preferredCurrency }
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
