/**
 * Asset Allocation Pie Chart Component
 * Shows portfolio distribution by asset type using Recharts
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieChartIcon } from 'lucide-react';
import { usePortfolioSummaries } from '../hooks/usePortfolios';
import { AssetType, AssetTypeLabels } from '../lib/types';
import type { PortfolioSummary } from '../lib/types';

interface AssetAllocationData {
  asset_type: AssetType;
  label: string;
  value: number;
  percentage: number;
  color: string;
}

// Color palette for different asset types
const ASSET_COLORS: Record<AssetType, string> = {
  [AssetType.STOCKS]: '#3b82f6', // Blue
  [AssetType.CRYPTO]: '#f59e0b', // Amber
  [AssetType.MUTUAL_FUNDS]: '#10b981', // Emerald
  [AssetType.COMMODITIES]: '#8b5cf6', // Violet
  [AssetType.REAL_ESTATE]: '#ef4444', // Red
};

function calculateAssetAllocation(summaries: PortfolioSummary[]): AssetAllocationData[] {
  // Group portfolios by asset type and sum their values
  const assetTotals = summaries.reduce((acc, portfolio) => {
    const value = portfolio.current_value || portfolio.total_invested;
    if (!acc[portfolio.asset_type]) {
      acc[portfolio.asset_type] = 0;
    }
    acc[portfolio.asset_type] += value;
    return acc;
  }, {} as Record<AssetType, number>);

  // Calculate total value for percentage calculations
  const totalValue = Object.values(assetTotals).reduce((sum, value) => sum + value, 0);

  // Convert to chart data format
  return Object.entries(assetTotals).map(([assetType, value]) => ({
    asset_type: assetType as AssetType,
    label: AssetTypeLabels[assetType as AssetType],
    value,
    percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
    color: ASSET_COLORS[assetType as AssetType],
  }));
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: AssetAllocationData;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium">{data.label}</p>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(data.value)} ({data.percentage.toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
}

interface CustomLegendProps {
  payload?: Array<{
    value: string;
    color: string;
    payload: AssetAllocationData;
  }>;
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2 md:gap-4 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1 md:gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs md:text-sm text-muted-foreground">
            {entry.payload.label} ({entry.payload.percentage.toFixed(1)}%)
          </span>
        </div>
      ))}
    </div>
  );
}

interface AssetAllocationChartProps {
  className?: string;
}

export function AssetAllocationChart({ className }: AssetAllocationChartProps) {
  const { data: summaries = [], isLoading, error } = usePortfolioSummaries();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Asset Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full bg-muted animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Asset Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Failed to load allocation data</p>
              <p className="text-sm text-red-600 mt-2">{error.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allocationData = calculateAssetAllocation(summaries);

  if (allocationData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Asset Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <PieChartIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No portfolio data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Asset Allocation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                className="md:!inner-radius-[60px] md:!outer-radius-[120px]"
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary table */}
        <div className="mt-6 space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">Breakdown</h4>
          {allocationData.map((item) => (
            <div key={item.asset_type} className="flex justify-between items-center py-2 border-b last:border-b-0">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm">{item.label}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{formatCurrency(item.value)}</div>
                <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}