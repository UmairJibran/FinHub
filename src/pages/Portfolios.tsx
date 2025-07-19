import {
  Plus,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  PieChart,
  BarChart3,
  DollarSign,
  Calendar,
  Edit,
  Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/app-layout';

// Mock portfolio data
const mockPortfolios = [
  {
    id: 1,
    name: 'Growth Portfolio',
    description: 'High-growth technology and innovation stocks',
    totalValue: 75420.5,
    totalCost: 70000.0,
    gain: 5420.5,
    gainPercentage: 7.74,
    dayChange: -125.3,
    dayChangePercentage: -0.17,
    positions: 12,
    lastUpdated: '2025-01-20',
    allocation: {
      stocks: 85,
      bonds: 10,
      cash: 5,
    },
    topHoldings: [
      { symbol: 'AAPL', name: 'Apple Inc.', value: 15000, percentage: 19.9 },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corp.',
        value: 12500,
        percentage: 16.6,
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        value: 10000,
        percentage: 13.3,
      },
    ],
  },
  {
    id: 2,
    name: 'Dividend Portfolio',
    description: 'Stable dividend-paying stocks and REITs',
    totalValue: 35000.0,
    totalCost: 33000.0,
    gain: 2000.0,
    gainPercentage: 6.06,
    dayChange: 45.2,
    dayChangePercentage: 0.13,
    positions: 8,
    lastUpdated: '2025-01-20',
    allocation: {
      stocks: 70,
      reits: 20,
      bonds: 10,
    },
    topHoldings: [
      {
        symbol: 'JNJ',
        name: 'Johnson & Johnson',
        value: 8000,
        percentage: 22.9,
      },
      { symbol: 'KO', name: 'Coca-Cola Co.', value: 6500, percentage: 18.6 },
      { symbol: 'PG', name: 'Procter & Gamble', value: 5500, percentage: 15.7 },
    ],
  },
  {
    id: 3,
    name: 'Crypto Portfolio',
    description: 'Cryptocurrency and digital assets',
    totalValue: 15000.0,
    totalCost: 14000.0,
    gain: 1000.0,
    gainPercentage: 7.14,
    dayChange: -165.0,
    dayChangePercentage: -1.09,
    positions: 5,
    lastUpdated: '2025-01-20',
    allocation: {
      bitcoin: 60,
      ethereum: 25,
      altcoins: 15,
    },
    topHoldings: [
      { symbol: 'BTC', name: 'Bitcoin', value: 9000, percentage: 60.0 },
      { symbol: 'ETH', name: 'Ethereum', value: 3750, percentage: 25.0 },
      { symbol: 'ADA', name: 'Cardano', value: 1125, percentage: 7.5 },
    ],
  },
];

export default function Portfolios() {
  const totalPortfolioValue = mockPortfolios.reduce(
    (sum, p) => sum + p.totalValue,
    0
  );
  const totalGain = mockPortfolios.reduce((sum, p) => sum + p.gain, 0);
  const totalGainPercentage =
    (totalGain / mockPortfolios.reduce((sum, p) => sum + p.totalCost, 0)) * 100;

  return (
    <DashboardLayout
      title="Investment Portfolios"
      description="Manage and track your investment portfolios"
    >
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
            <div className="text-2xl font-bold">
              ${totalPortfolioValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Gain
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +${totalGain.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalGainPercentage.toFixed(2)}% return
            </p>
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
            <div className="text-2xl font-bold">{mockPortfolios.length}</div>
            <p className="text-xs text-muted-foreground">
              {mockPortfolios.reduce((sum, p) => sum + p.positions, 0)} total
              positions
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 hover:border-primary transition-colors">
          <CardContent className="flex flex-col items-center justify-center h-full p-6">
            <Button asChild className="w-full">
              <Link to="/portfolios/create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Portfolio
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockPortfolios.map((portfolio) => (
          <Card
            key={portfolio.id}
            className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">
                    {portfolio.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {portfolio.description}
                  </p>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Value and Performance */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    ${portfolio.totalValue.toLocaleString()}
                  </span>
                  <div className="text-right">
                    <div
                      className={`flex items-center gap-1 text-sm font-medium ${
                        portfolio.gain >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {portfolio.gain >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {portfolio.gain >= 0 ? '+' : ''}$
                      {portfolio.gain.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {portfolio.gainPercentage >= 0 ? '+' : ''}
                      {portfolio.gainPercentage.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Today:</span>
                  <span
                    className={`font-medium ${
                      portfolio.dayChange >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {portfolio.dayChange >= 0 ? '+' : ''}$
                    {portfolio.dayChange.toLocaleString()}(
                    {portfolio.dayChangePercentage >= 0 ? '+' : ''}
                    {portfolio.dayChangePercentage}%)
                  </span>
                </div>
              </div>

              {/* Top Holdings */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Top Holdings
                </h4>
                <div className="space-y-2">
                  {portfolio.topHoldings.slice(0, 3).map((holding) => (
                    <div
                      key={holding.symbol}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center text-xs font-medium">
                          {holding.symbol.charAt(0)}
                        </div>
                        <span className="font-medium">{holding.symbol}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          ${holding.value.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {holding.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Portfolio Stats */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {portfolio.positions}
                  </div>
                  <div className="text-xs text-muted-foreground">Positions</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {(
                      (portfolio.totalValue / totalPortfolioValue) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                  <div className="text-xs text-muted-foreground">of Total</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to={`/portfolios/${portfolio.id}`}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to={`/portfolios/${portfolio.id}/edit`}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <Link to={`/portfolios/${portfolio.id}/add-position`}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Link>
                </Button>
              </div>

              {/* Last Updated */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
                <Calendar className="h-3 w-3" />
                Updated {new Date(portfolio.lastUpdated).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                asChild
                variant="outline"
                className="h-auto p-4 flex flex-col gap-2"
              >
                <Link to="/portfolios/create">
                  <Plus className="h-6 w-6" />
                  <span className="font-medium">Create Portfolio</span>
                  <span className="text-xs text-muted-foreground">
                    Start a new portfolio
                  </span>
                </Link>
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
    </DashboardLayout>
  );
}
