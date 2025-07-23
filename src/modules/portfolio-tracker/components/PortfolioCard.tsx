/**
 * Portfolio card component for displaying portfolio summaries
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Trash2,
  Plus,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AssetTypeLabels } from '../lib/types';
import type { PortfolioSummary } from '../lib/types';
import { formatCurrency } from '@/lib/currency-config';

// ============================================================================
// TYPES
// ============================================================================

interface PortfolioCardProps {
  portfolio: PortfolioSummary;
  totalPortfolioValue?: number;
  onEdit?: (portfolio: PortfolioSummary) => void;
  onDelete?: (portfolio: PortfolioSummary) => void;
  onAddPosition?: (portfolio: PortfolioSummary) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PortfolioCard({
  portfolio,
  totalPortfolioValue = 0,
  onEdit,
  onDelete,
  onAddPosition
}: PortfolioCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const hasGainLoss = portfolio.unrealized_gain_loss !== undefined;
  const isPositive = (portfolio.unrealized_gain_loss || 0) >= 0;
  const allocationPercentage = totalPortfolioValue > 0 
    ? (portfolio.total_invested / totalPortfolioValue) * 100 
    : 0;



  // Format percentage with proper sign
  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1 flex items-center gap-2">
              {portfolio.name}
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                {AssetTypeLabels[portfolio.asset_type]}
              </span>
            </CardTitle>
            {portfolio.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {portfolio.description}
              </p>
            )}
          </div>
          
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/portfolios/${portfolio.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(portfolio)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Portfolio
                </DropdownMenuItem>
              )}
              {onAddPosition && (
                <DropdownMenuItem onClick={() => onAddPosition(portfolio)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Position
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(portfolio)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Portfolio
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Value and Performance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              {formatCurrency(portfolio.current_value || portfolio.total_invested)}
            </span>
            {hasGainLoss && (
              <div className="text-right">
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {formatCurrency(portfolio.unrealized_gain_loss || 0)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatPercentage(portfolio.unrealized_gain_loss_percentage || 0)}
                </div>
              </div>
            )}
          </div>

          {!hasGainLoss && (
            <div className="text-sm text-muted-foreground">
              Total Invested: {formatCurrency(portfolio.total_invested)}
            </div>
          )}
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold">
              {portfolio.total_positions}
            </div>
            <div className="text-xs text-muted-foreground">
              Position{portfolio.total_positions !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">
              {allocationPercentage.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">of Total</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button asChild variant="outline" size="sm" className="flex-1 h-9">
            <Link to={`/portfolios/${portfolio.id}`}>
              <Eye className="h-4 w-4 mr-1" />
              View
            </Link>
          </Button>
          {onEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-9"
              onClick={() => onEdit(portfolio)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          {onAddPosition && (
            <Button 
              size="sm" 
              className="flex-1 h-9"
              onClick={() => onAddPosition(portfolio)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
          <Calendar className="h-3 w-3" />
          Updated {new Date(portfolio.updated_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

interface EmptyPortfolioCardProps {
  onCreatePortfolio?: () => void;
}

export function EmptyPortfolioCard({ onCreatePortfolio }: EmptyPortfolioCardProps) {
  return (
    <Card className="border-dashed border-2 hover:border-primary transition-colors">
      <CardContent className="flex flex-col items-center justify-center h-full p-6 min-h-[200px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium mb-1">Create Your First Portfolio</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start tracking your investments by creating a portfolio
            </p>
            <Button onClick={onCreatePortfolio} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              New Portfolio
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// LOADING CARD COMPONENT
// ============================================================================

export function PortfolioCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-muted rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
          </div>
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
            <div className="space-y-1">
              <div className="h-4 bg-muted rounded w-16 animate-pulse" />
              <div className="h-3 bg-muted rounded w-12 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center space-y-1">
            <div className="h-6 bg-muted rounded w-8 mx-auto animate-pulse" />
            <div className="h-3 bg-muted rounded w-12 mx-auto animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <div className="h-6 bg-muted rounded w-8 mx-auto animate-pulse" />
            <div className="h-3 bg-muted rounded w-12 mx-auto animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
          <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
          <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}