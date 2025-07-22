/**
 * Portfolio detail page with position management
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Settings, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/app-layout';
import { usePortfolio } from '@/modules/portfolio-tracker/hooks/usePortfolios';
import { usePortfolioPositions } from '@/modules/portfolio-tracker/hooks/usePositions';
import { PositionList } from '@/modules/portfolio-tracker/components/PositionList';
import { PositionForm } from '@/modules/portfolio-tracker/components/PositionForm';
import { DeletePositionDialog } from '@/modules/portfolio-tracker/components/DeletePositionDialog';
import { AssetTypeLabels } from '@/modules/portfolio-tracker/lib/types';
import type { PositionWithMetrics, CreatePositionInput, UpdatePositionInput } from '@/modules/portfolio-tracker/lib/types';
import { formatCurrency } from '@/lib/currency-config';

export default function PortfolioDetail() {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const navigate = useNavigate();
  
  const [isPositionFormOpen, setIsPositionFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<PositionWithMetrics | null>(null);
  const [deletingPosition, setDeletingPosition] = useState<PositionWithMetrics | null>(null);

  // Fetch portfolio data
  const { data: portfolio, isLoading: portfolioLoading, error: portfolioError } = usePortfolio(portfolioId!);
  
  // Fetch positions data
  const {
    positions,
    isLoading: positionsLoading,
    error: positionsError,
    createPosition,
    updatePosition,
    deletePosition,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    deleteError,
  } = usePortfolioPositions(portfolioId!);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleAddPosition = () => {
    setEditingPosition(null);
    setIsPositionFormOpen(true);
  };

  const handleEditPosition = (position: PositionWithMetrics) => {
    setEditingPosition(position);
    setIsPositionFormOpen(true);
  };

  const handleDeletePosition = (position: PositionWithMetrics) => {
    setDeletingPosition(position);
    setIsDeleteDialogOpen(true);
  };

  const handlePositionFormSubmit = async (data: CreatePositionInput | UpdatePositionInput) => {
    try {
      if (editingPosition) {
        // Update existing position
        await updatePosition({
          id: editingPosition.id,
          input: data as UpdatePositionInput,
        });
      } else {
        // Create new position
        await createPosition(data as CreatePositionInput);
      }
      setIsPositionFormOpen(false);
      setEditingPosition(null);
    } catch (error) {
      console.error('Error submitting position form:', error);
      // Error is handled by the hook and displayed in the form
    }
  };

  const handleDeleteConfirm = async (positionId: string) => {
    try {
      await deletePosition(positionId);
      setIsDeleteDialogOpen(false);
      setDeletingPosition(null);
    } catch (error) {
      console.error('Error deleting position:', error);
      // Error is handled by the hook
    }
  };

  const handlePositionFormClose = () => {
    setIsPositionFormOpen(false);
    setEditingPosition(null);
  };

  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false);
    setDeletingPosition(null);
  };

  // ============================================================================
  // LOADING AND ERROR STATES
  // ============================================================================

  if (portfolioLoading) {
    return (
      <DashboardLayout
        title="Loading Portfolio..."
        description="Please wait while we load your portfolio details"
      >
        <div className="space-y-6">
          <div className="h-32 bg-muted rounded-lg animate-pulse" />
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  if (portfolioError || !portfolio) {
    return (
      <DashboardLayout
        title="Portfolio Not Found"
        description="The requested portfolio could not be found"
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Portfolio Not Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {portfolioError?.message || 'The portfolio you are looking for does not exist or you do not have access to it.'}
            </p>
            <div className="flex gap-4">
              <Button onClick={() => navigate('/portfolios')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Portfolios
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Calculate portfolio metrics
  const totalInvested = positions.reduce((sum, p) => sum + p.total_invested, 0);
  const totalCurrentValue = positions.reduce((sum, p) => sum + (p.current_value || p.total_invested), 0);
  const totalUnrealizedGainLoss = positions.reduce((sum, p) => sum + (p.unrealized_gain_loss || 0), 0);
  const totalGainLossPercentage = totalInvested > 0 ? (totalUnrealizedGainLoss / totalInvested) * 100 : 0;



  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <DashboardLayout
      title={portfolio.name}
      description={portfolio.description || `${AssetTypeLabels[portfolio.asset_type]} portfolio`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/portfolios')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Portfolios
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{portfolio.name}</h1>
              <Badge variant="outline">{AssetTypeLabels[portfolio.asset_type]}</Badge>
            </div>
            {portfolio.description && (
              <p className="text-muted-foreground mt-1">{portfolio.description}</p>
            )}
          </div>
        </div>
        
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Error Messages */}
      {(createError || updateError || deleteError || positionsError) && (
        <Card className="mb-6 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">
                  Operation Failed
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {createError?.message || 
                   updateError?.message || 
                   deleteError?.message || 
                   positionsError?.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invested
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalInvested)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCurrentValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unrealized Gain/Loss
            </CardTitle>
            {totalUnrealizedGainLoss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              totalUnrealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {totalUnrealizedGainLoss >= 0 ? '+' : ''}{formatCurrency(totalUnrealizedGainLoss)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalGainLossPercentage >= 0 ? '+' : ''}{totalGainLossPercentage.toFixed(2)}% return
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Positions
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {positions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active investments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Position Management */}
      <PositionList
        positions={positions}
        isLoading={positionsLoading}
        onAddPosition={handleAddPosition}
        onEditPosition={handleEditPosition}
        onDeletePosition={handleDeletePosition}
        portfolioName={portfolio.name}
      />

      {/* Position Form Dialog */}
      <PositionForm
        portfolioId={portfolio.id}
        position={editingPosition || undefined}
        isOpen={isPositionFormOpen}
        onClose={handlePositionFormClose}
        onSubmit={handlePositionFormSubmit}
        isLoading={isCreating || isUpdating}
      />

      {/* Delete Confirmation Dialog */}
      <DeletePositionDialog
        position={deletingPosition}
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}