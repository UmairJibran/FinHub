import { useState, useEffect } from 'react';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/app-layout';
import { supabase, isSupabaseAvailable } from '@/lib/supabase/client';
import {
  PortfolioCard,
  EmptyPortfolioCard,
  PortfolioCardSkeleton,
  PortfolioForm,
  DeletePortfolioDialog,
} from '@/modules/portfolio-tracker/components';
import { usePortfolioManager } from '@/modules/portfolio-tracker/hooks';
import { useAuth } from '@/hooks/useAuth';
import type {
  PortfolioSummary,
  PortfolioFormData,
} from '@/modules/portfolio-tracker/lib/types';

export default function Portfolios() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPortfolio, setEditingPortfolio] =
    useState<PortfolioSummary | null>(null);
  const [deletingPortfolio, setDeletingPortfolio] =
    useState<PortfolioSummary | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // Refresh user data on component mount to ensure we have the latest currency preferences
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Portfolio data and operations
  const {
    summaries: portfolios,
    count: portfolioCount,
    isLoading,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    refetchPortfolios,
    refetchSummaries,
  } = usePortfolioManager();

  // Debug function to check Supabase connection
  const checkConnection = async () => {
    try {
      setDebugInfo('Checking connection...');
      if (!isSupabaseAvailable || !supabase) {
        setDebugInfo('Supabase client not available');
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setDebugInfo('No authenticated user found');
        return;
      }

      setDebugInfo(`User authenticated: ${user.id}`);

      // Test database connection
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .limit(1);

      if (error) {
        setDebugInfo(`Database error: ${error.message}`);
        return;
      }

      setDebugInfo(
        `Connection successful. Found ${data?.length || 0} portfolios.`
      );

      // Force refresh
      refetchPortfolios();
      refetchSummaries();
    } catch (error) {
      setDebugInfo(`Error: ${error}`);
    }
  };

  // Calculate totals
  const totalPortfolioValue = portfolios.reduce(
    (sum, p) => sum + (p.current_value || p.total_invested),
    0
  );
  const totalInvested = portfolios.reduce(
    (sum, p) => sum + p.total_invested,
    0
  );
  const totalGain = portfolios.reduce(
    (sum, p) => sum + (p.unrealized_gain_loss || 0),
    0
  );
  const totalGainPercentage =
    totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
  const totalPositions = portfolios.reduce(
    (sum, p) => sum + p.total_positions,
    0
  );

  // Event handlers
  const handleCreatePortfolio = async (data: PortfolioFormData) => {
    try {
      await createPortfolio(data);
      setShowCreateForm(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleUpdatePortfolio = async (data: PortfolioFormData) => {
    if (!editingPortfolio) return;

    try {
      await updatePortfolio({
        id: editingPortfolio.id,
        input: data,
      });
      setEditingPortfolio(null);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    try {
      await deletePortfolio(portfolioId);
      setDeletingPortfolio(null);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleEditPortfolio = (portfolio: PortfolioSummary) => {
    setEditingPortfolio(portfolio);
  };

  const handleDeleteClick = (portfolio: PortfolioSummary) => {
    setDeletingPortfolio(portfolio);
  };

  const handleAddPosition = (portfolio: PortfolioSummary) => {
    // Navigate to portfolio detail page where positions can be managed
    navigate(`/portfolios/${portfolio.id}`);
  };

  // Show create form
  if (showCreateForm) {
    return (
      <DashboardLayout
        title="Create Portfolio"
        description="Create a new investment portfolio"
      >
        <div className="max-w-2xl mx-auto">
          <PortfolioForm
            onSubmit={handleCreatePortfolio}
            onCancel={() => setShowCreateForm(false)}
            isLoading={isCreating}
            error={createError?.message || null}
          />
        </div>
      </DashboardLayout>
    );
  }

  // Show edit form
  if (editingPortfolio) {
    return (
      <DashboardLayout
        title="Edit Portfolio"
        description="Update your portfolio details"
      >
        <div className="max-w-2xl mx-auto">
          <PortfolioForm
            portfolio={editingPortfolio}
            onSubmit={handleUpdatePortfolio}
            onCancel={() => setEditingPortfolio(null)}
            isLoading={isUpdating}
            error={updateError?.message || null}
          />
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout
        title="Investment Portfolios"
        description="Manage and track your investment portfolios"
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Failed to Load Portfolios
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {error.message ||
                'An error occurred while loading your portfolios.'}
            </p>
            <div className="flex gap-4">
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  refetchPortfolios();
                  refetchSummaries();
                }}
              >
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Show create portfolio button even in error state */}
        <Card className="mt-8 border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Create New Portfolio</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Start tracking your investments by creating a portfolio
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Portfolio
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Investment Portfolios"
      description="Manage and track your investment portfolios"
    >
      {/* Debug Info */}
      {debugInfo && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="font-mono text-sm">{debugInfo}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDebugInfo('')}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Actions */}
      <div className="flex gap-2 mb-4">
        <Button onClick={checkConnection}>Check Connection</Button>
        <Button onClick={() => setShowCreateForm(true)}>New Portfolio</Button>
        <Button
          onClick={() => {
            refetchPortfolios();
            refetchSummaries();
          }}
        >
          Refresh Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 bg-muted rounded animate-pulse" />
            ) : (
              <div className="text-2xl font-bold">
                ${totalPortfolioValue.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Gain/Loss
            </CardTitle>
            {totalGain >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded w-20 animate-pulse" />
              </div>
            ) : (
              <>
                <div
                  className={`text-2xl font-bold ${
                    totalGain >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {totalGain >= 0 ? '+' : ''}${totalGain.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalGainPercentage >= 0 ? '+' : ''}
                  {totalGainPercentage.toFixed(2)}% return
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Portfolios
            </CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded w-24 animate-pulse" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{portfolioCount}</div>
                <p className="text-xs text-muted-foreground">
                  {totalPositions} total position
                  {totalPositions !== 1 ? 's' : ''}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 hover:border-primary transition-colors">
          <CardContent className="flex flex-col items-center justify-center h-full p-6">
            <Button
              onClick={() => setShowCreateForm(true)}
              className="w-full"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Portfolio
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <PortfolioCardSkeleton key={index} />
          ))
        ) : portfolios.length === 0 ? (
          // Empty state
          <div className="col-span-full">
            <EmptyPortfolioCard
              onCreatePortfolio={() => setShowCreateForm(true)}
            />
          </div>
        ) : (
          // Portfolio cards
          portfolios.map((portfolio) => (
            <PortfolioCard
              key={portfolio.id}
              portfolio={portfolio}
              totalPortfolioValue={totalPortfolioValue}
              onEdit={handleEditPortfolio}
              onDelete={handleDeleteClick}
              onAddPosition={handleAddPosition}
            />
          ))
        )}
      </div>

      {/* Quick Actions */}
      {portfolios.length > 0 && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col gap-2"
                  onClick={() => setShowCreateForm(true)}
                  disabled={isLoading}
                >
                  <Plus className="h-6 w-6" />
                  <span className="font-medium">Create Portfolio</span>
                  <span className="text-xs text-muted-foreground">
                    Start a new portfolio
                  </span>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-auto p-4 flex flex-col gap-2"
                >
                  <Link to="/portfolios/rebalance">
                    <PieChart className="h-6 w-6" />
                    <span className="font-medium">Rebalance</span>
                    <span className="text-xs text-muted-foreground">
                      Optimize allocation
                    </span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-auto p-4 flex flex-col gap-2"
                >
                  <Link to="/analytics">
                    <BarChart3 className="h-6 w-6" />
                    <span className="font-medium">Analytics</span>
                    <span className="text-xs text-muted-foreground">
                      Performance analysis
                    </span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-auto p-4 flex flex-col gap-2"
                >
                  <Link to="/portfolios/import">
                    <DollarSign className="h-6 w-6" />
                    <span className="font-medium">Import Data</span>
                    <span className="text-xs text-muted-foreground">
                      Import from broker
                    </span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeletePortfolioDialog
        portfolio={deletingPortfolio}
        isOpen={!!deletingPortfolio}
        onClose={() => setDeletingPortfolio(null)}
        onConfirm={handleDeletePortfolio}
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}
