/**
 * Performance Chart Component
 * Shows portfolio value over time using Recharts
 */

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp } from 'lucide-react';
import { usePortfolioSummaries } from '../hooks/usePortfolios';
import { formatCurrency } from '@/lib/currency-config';

// Mock data for performance chart
// In a real implementation, this would come from an API call with historical data
const generateMockPerformanceData = (portfolioCount: number) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  // Get the last 6 months
  const recentMonths = Array.from({ length: 6 }, (_, i) => {
    const monthIndex = (currentMonth - 5 + i) % 12;
    return monthIndex >= 0 ? monthIndex : monthIndex + 12;
  });

  const baseValue = 100000;
  const volatility = 0.05; // 5% volatility
  
  return recentMonths.map((monthIndex, i) => {
    // Create a slightly upward trend with some randomness
    const trend = 1 + (i * 0.02); // 2% upward trend per month
    const randomFactor = 1 + (Math.random() * volatility * 2 - volatility);
    const totalValue = baseValue * trend * randomFactor;
    
    const data: any = {
      month: months[monthIndex],
      total: Math.round(totalValue),
    };
    
    // Add individual portfolio values if we have portfolios
    if (portfolioCount > 0) {
      for (let p = 1; p <= Math.min(portfolioCount, 3); p++) {
        const portfolioShare = (1 / portfolioCount) * (1 + (Math.random() * 0.4 - 0.2));
        data[`portfolio${p}`] = Math.round(totalValue * portfolioShare);
      }
    }
    
    return data;
  });
};



interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    dataKey: string;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex justify-between items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name === 'total' ? 'Total Value' : `Portfolio ${entry.dataKey.replace('portfolio', '')}`}</span>
            </div>
            <span className="font-medium">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// Portfolio colors for the chart
const PORTFOLIO_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ef4444', // Red
];

interface PerformanceChartProps {
  className?: string;
}

export function PerformanceChart({ className }: PerformanceChartProps) {
  const [timeRange, setTimeRange] = useState<string>('6m');
  const { data: portfolioSummaries = [], isLoading, error } = usePortfolioSummaries();
  
  // Generate mock data based on the number of portfolios
  const performanceData = generateMockPerformanceData(portfolioSummaries.length);
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Portfolio Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="w-full h-48 bg-muted animate-pulse rounded" />
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
            <TrendingUp className="h-5 w-5" />
            Portfolio Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Failed to load performance data</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (portfolioSummaries.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Portfolio Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No portfolio data available</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create portfolios to track performance over time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Portfolio Performance
        </CardTitle>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">1 Month</SelectItem>
            <SelectItem value="3m">3 Months</SelectItem>
            <SelectItem value="6m">6 Months</SelectItem>
            <SelectItem value="1y">1 Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={performanceData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10 }}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={(value) => `$${value/1000}k`}
                tick={{ fontSize: 10 }}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Total line */}
              <Line
                type="monotone"
                dataKey="total"
                name="Total Value"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              
              {/* Individual portfolio lines */}
              {portfolioSummaries.slice(0, 3).map((portfolio, index) => (
                <Line
                  key={portfolio.id}
                  type="monotone"
                  dataKey={`portfolio${index + 1}`}
                  name={portfolio.name}
                  stroke={PORTFOLIO_COLORS[index % PORTFOLIO_COLORS.length]}
                  strokeWidth={1.5}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          <p>Note: This chart shows simulated performance data for demonstration purposes.</p>
        </div>
      </CardContent>
    </Card>
  );
}