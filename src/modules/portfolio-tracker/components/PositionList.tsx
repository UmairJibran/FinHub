/**
 * Position list component displaying positions within a portfolio
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import {
  Plus,
  MoreHorizontal,
  Edit3,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
} from 'lucide-react';
import type { PositionWithMetrics } from '../lib/types';
import { calculatePositionMetrics } from '../lib/cost-basis-calculator';

// ============================================================================
// TYPES
// ============================================================================

interface PositionListProps {
  positions: PositionWithMetrics[];
  isLoading?: boolean;
  onAddPosition: () => void;
  onEditPosition: (position: PositionWithMetrics) => void;
  onDeletePosition: (position: PositionWithMetrics) => void;
  portfolioName?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PositionList({
  positions,
  isLoading = false,
  onAddPosition,
  onEditPosition,
  onDeletePosition,
  portfolioName,
}: PositionListProps) {
  const [sortBy, setSortBy] = useState<'symbol' | 'value' | 'gain' | 'created'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Calculate portfolio totals
  const portfolioTotals = positions.reduce(
    (acc, position) => {
      acc.totalInvested += position.total_invested;
      if (position.current_value) {
        acc.totalCurrentValue += position.current_value;
      }
      if (position.unrealized_gain_loss) {
        acc.totalUnrealizedGainLoss += position.unrealized_gain_loss;
      }
      return acc;
    },
    { totalInvested: 0, totalCurrentValue: 0, totalUnrealizedGainLoss: 0 }
  );

  const portfolioGainLossPercentage =
    portfolioTotals.totalInvested > 0
      ? (portfolioTotals.totalUnrealizedGainLoss / portfolioTotals.totalInvested) * 100
      : 0;

  // Sort positions
  const sortedPositions = [...positions].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (sortBy) {
      case 'symbol':
        aValue = a.symbol;
        bValue = b.symbol;
        break;
      case 'value':
        aValue = a.current_value || a.total_invested;
        bValue = b.current_value || b.total_invested;
        break;
      case 'gain':
        aValue = a.unrealized_gain_loss || 0;
        bValue = b.unrealized_gain_loss || 0;
        break;
      case 'created':
      default:
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    const numA = typeof aValue === 'number' ? aValue : 0;
    const numB = typeof bValue === 'number' ? bValue : 0;
    
    return sortOrder === 'asc' ? numA - numB : numB - numA;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const getGainLossColor = (value: number) => {
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  const getGainLossIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4" />;
    if (value < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      {positions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {portfolioName ? `${portfolioName} Summary` : 'Portfolio Summary'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(portfolioTotals.totalInvested)}
                </p>
              </div>
              
              {portfolioTotals.totalCurrentValue > 0 && (
                <>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current Value</p>
                    <p className="text-2xl font-semibold">
                      {formatCurrency(portfolioTotals.totalCurrentValue)}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Unrealized Gain/Loss</p>
                    <div className="flex items-center gap-2">
                      <p className={`text-2xl font-semibold ${getGainLossColor(portfolioTotals.totalUnrealizedGainLoss)}`}>
                        {formatCurrency(portfolioTotals.totalUnrealizedGainLoss)}
                      </p>
                      <Badge 
                        variant={portfolioTotals.totalUnrealizedGainLoss >= 0 ? 'default' : 'destructive'}
                        className="flex items-center gap-1"
                      >
                        {getGainLossIcon(portfolioTotals.totalUnrealizedGainLoss)}
                        {formatPercentage(portfolioGainLossPercentage)}
                      </Badge>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Positions ({positions.length})
            </CardTitle>
            <Button onClick={onAddPosition} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Position
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No positions yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your investments by adding your first position.
              </p>
              <Button onClick={onAddPosition}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Position
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          if (sortBy === 'symbol') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('symbol');
                            setSortOrder('asc');
                          }
                        }}
                      >
                        Symbol
                      </TableHead>
                      <TableHead>Asset Name</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Avg Cost</TableHead>
                      <TableHead className="text-right">Total Invested</TableHead>
                      <TableHead className="text-right">Current Price</TableHead>
                      <TableHead className="text-right">Current Value</TableHead>
                      <TableHead className="text-right">Gain/Loss</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPositions.map((position) => {
                      const metrics = calculatePositionMetrics(
                        position,
                        position.current_price || undefined
                      );

                      return (
                        <TableRow key={position.id}>
                          <TableCell className="font-medium">
                            <Badge variant="outline">{position.symbol}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] truncate" title={position.name}>
                              {position.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {position.quantity.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 8,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(position.average_cost)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(position.total_invested)}
                          </TableCell>
                          <TableCell className="text-right">
                            {position.current_price 
                              ? formatCurrency(position.current_price)
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {metrics.currentValue 
                              ? formatCurrency(metrics.currentValue)
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {metrics.unrealizedGainLoss !== undefined ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className={getGainLossColor(metrics.unrealizedGainLoss)}>
                                  {formatCurrency(metrics.unrealizedGainLoss)}
                                </span>
                                {metrics.unrealizedGainLossPercentage !== undefined && (
                                  <Badge 
                                    variant={metrics.unrealizedGainLoss >= 0 ? 'default' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {formatPercentage(metrics.unrealizedGainLossPercentage)}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEditPosition(position)}>
                                  <Edit3 className="h-4 w-4 mr-2" />
                                  Edit Position
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => onDeletePosition(position)}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Position
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {sortedPositions.map((position) => {
                  const metrics = calculatePositionMetrics(
                    position,
                    position.current_price || undefined
                  );

                  return (
                    <Card key={position.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-sm font-medium">
                              {position.symbol}
                            </Badge>
                            {metrics.unrealizedGainLoss !== undefined && (
                              <Badge 
                                variant={metrics.unrealizedGainLoss >= 0 ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {getGainLossIcon(metrics.unrealizedGainLoss)}
                                {formatPercentage(metrics.unrealizedGainLossPercentage || 0)}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-medium text-sm leading-tight">
                            {position.name}
                          </h3>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditPosition(position)}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit Position
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onDeletePosition(position)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Position
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Quantity</p>
                          <p className="font-medium">
                            {position.quantity.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 8,
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Avg Cost</p>
                          <p className="font-medium">{formatCurrency(position.average_cost)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Total Invested</p>
                          <p className="font-medium">{formatCurrency(position.total_invested)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Current Price</p>
                          <p className="font-medium">
                            {position.current_price 
                              ? formatCurrency(position.current_price)
                              : '-'
                            }
                          </p>
                        </div>
                      </div>

                      {metrics.currentValue && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-muted-foreground text-xs">Current Value</p>
                              <p className="font-semibold">{formatCurrency(metrics.currentValue)}</p>
                            </div>
                            {metrics.unrealizedGainLoss !== undefined && (
                              <div className="text-right">
                                <p className="text-muted-foreground text-xs">Gain/Loss</p>
                                <p className={`font-semibold ${getGainLossColor(metrics.unrealizedGainLoss)}`}>
                                  {formatCurrency(metrics.unrealizedGainLoss)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PositionList;