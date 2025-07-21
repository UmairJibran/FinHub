/**
 * Transaction History Component
 * Shows recent transactions with filtering and pagination
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Search, Filter, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useRecentTransactions } from '../hooks/useTransactions';
import { TransactionType } from '../lib/types';
import type { Transaction } from '../lib/types';

interface TransactionWithDetails extends Transaction {
  position?: {
    symbol: string;
    name: string;
    portfolio?: {
      name: string;
      asset_type: string;
    };
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface TransactionItemProps {
  transaction: TransactionWithDetails;
}

function TransactionItem({ transaction }: TransactionItemProps) {
  const isBuy = transaction.type === TransactionType.BUY;
  const totalValue = transaction.quantity * transaction.price;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${
          isBuy ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
        }`}>
          {isBuy ? (
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {isBuy ? 'Bought' : 'Sold'} {transaction.quantity} shares
            </span>
            <Badge variant={isBuy ? 'default' : 'secondary'}>
              {transaction.type}
            </Badge>
          </div>
          
          {transaction.position && (
            <div className="text-sm text-muted-foreground">
              {transaction.position.symbol} - {transaction.position.name}
              {transaction.position.portfolio && (
                <span className="ml-2">
                  in {transaction.position.portfolio.name}
                </span>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(transaction.transaction_date)}</span>
            <span>{formatTime(transaction.transaction_date)}</span>
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <div className="font-medium">
          {formatCurrency(transaction.price)} per share
        </div>
        <div className={`text-sm ${
          isBuy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}>
          {isBuy ? '+' : '-'}{formatCurrency(totalValue)}
        </div>
      </div>
    </div>
  );
}

interface TransactionHistoryProps {
  limit?: number;
  showFilters?: boolean;
  className?: string;
}

export function TransactionHistory({ 
  limit = 10, 
  showFilters = true, 
  className 
}: TransactionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [displayLimit, setDisplayLimit] = useState(limit);

  const { data: transactions = [], isLoading, error } = useRecentTransactions(displayLimit);

  // Filter transactions based on search and type
  const filteredTransactions = (transactions as TransactionWithDetails[]).filter((transaction) => {
    const matchesSearch = !searchTerm || 
      (transaction.position?.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
       transaction.position?.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-32" />
                    <div className="h-3 bg-muted rounded animate-pulse w-24" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-20" />
                  <div className="h-3 bg-muted rounded animate-pulse w-16" />
                </div>
              </div>
            ))}
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
            <Activity className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load transactions</p>
            <p className="text-sm text-red-600 mt-2">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No transactions yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start by adding positions to your portfolios
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
          {transactions.length > 0 && (
            <Badge variant="secondary">
              {filteredTransactions.length} of {transactions.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by symbol or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="BUY">Buy Orders</SelectItem>
                <SelectItem value="SELL">Sell Orders</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions match your filters</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction as TransactionWithDetails} />
            ))
          )}
        </div>

        {transactions.length >= displayLimit && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => setDisplayLimit(prev => prev + 10)}
            >
              Load More Transactions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}