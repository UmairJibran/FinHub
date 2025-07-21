/**
 * Transaction History Component - Shows audit trail of buy/sell operations
 */

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import {
  useTransactions,
  useTransactionsByPosition,
  useTransactionsByPortfolio,
} from '../hooks/useTransactions';
import type { TransactionQueryParams } from '../lib/transaction-service';
import type { TransactionType } from '../lib/types';

// ============================================================================
// INTERFACES
// ============================================================================

interface TransactionHistoryProps {
  positionId?: string;
  portfolioId?: string;
  showFilters?: boolean;
  maxHeight?: string;
  pageSize?: number;
}

interface TransactionFilters {
  search: string;
  transactionType: TransactionType | 'all';
  startDate: string;
  endDate: string;
  sortBy: 'transaction_date' | 'created_at' | 'quantity' | 'price';
  sortOrder: 'asc' | 'desc';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TransactionHistory({
  positionId,
  portfolioId,
  showFilters = true,
  maxHeight = '600px',
  pageSize = 20,
}: TransactionHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    transactionType: 'all',
    startDate: '',
    endDate: '',
    sortBy: 'transaction_date',
    sortOrder: 'desc',
  });

  // Build query parameters
  const queryParams: TransactionQueryParams = useMemo(() => {
    const params: TransactionQueryParams = {
      page: currentPage,
      limit: pageSize,
      sort_by: filters.sortBy,
      sort_order: filters.sortOrder,
    };

    if (positionId) {
      params.position_id = positionId;
    }

    if (portfolioId) {
      params.portfolio_id = portfolioId;
    }

    if (filters.search) {
      params.search = filters.search;
    }

    if (filters.transactionType !== 'all') {
      params.transaction_type = filters.transactionType;
    }

    if (filters.startDate) {
      params.start_date = filters.startDate;
    }

    if (filters.endDate) {
      params.end_date = filters.endDate;
    }

    return params;
  }, [positionId, portfolioId, currentPage, pageSize, filters]);

  // Use appropriate hook based on scope
  const transactionsQuery = positionId
    ? useTransactionsByPosition(positionId)
    : portfolioId
    ? useTransactionsByPortfolio(portfolioId)
    : useTransactions(queryParams);

  // For position and portfolio specific queries, we need to handle filtering client-side
  const filteredTransactions = useMemo(() => {
    if (positionId || portfolioId) {
      let transactions = transactionsQuery.data || [];

      // Apply client-side filtering for position/portfolio specific queries
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        transactions = transactions.filter(
          (t) =>
            t.position?.symbol.toLowerCase().includes(searchLower) ||
            t.position?.name.toLowerCase().includes(searchLower)
        );
      }

      if (filters.transactionType !== 'all') {
        transactions = transactions.filter((t) => t.type === filters.transactionType);
      }

      if (filters.startDate) {
        transactions = transactions.filter(
          (t) => new Date(t.transaction_date) >= new Date(filters.startDate)
        );
      }

      if (filters.endDate) {
        transactions = transactions.filter(
          (t) => new Date(t.transaction_date) <= new Date(filters.endDate)
        );
      }

      // Apply sorting
      transactions.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (filters.sortBy) {
          case 'transaction_date':
            aValue = new Date(a.transaction_date);
            bValue = new Date(b.transaction_date);
            break;
          case 'created_at':
            aValue = new Date(a.created_at);
            bValue = new Date(b.created_at);
            break;
          case 'quantity':
            aValue = a.quantity;
            bValue = b.quantity;
            break;
          case 'price':
            aValue = a.price;
            bValue = b.price;
            break;
          default:
            aValue = new Date(a.transaction_date);
            bValue = new Date(b.transaction_date);
        }

        if (filters.sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });

      return transactions;
    }

    return transactionsQuery.data?.transactions || [];
  }, [transactionsQuery.data, filters, positionId, portfolioId]);

  const totalTransactions = positionId || portfolioId 
    ? filteredTransactions.length 
    : transactionsQuery.data?.total || 0;

  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      transactionType: 'all',
      startDate: '',
      endDate: '',
      sortBy: 'transaction_date',
      sortOrder: 'desc',
    });
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getTransactionBadgeVariant = (type: TransactionType) => {
    return type === 'BUY' ? 'default' : 'destructive';
  };

  if (transactionsQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Loading transaction history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactionsQuery.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Error loading transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            Failed to load transaction history. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          {totalTransactions > 0
            ? `Showing ${filteredTransactions.length} of ${totalTransactions} transactions`
            : 'No transactions found'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showFilters && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  placeholder="Search by symbol or name..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Transaction Type</label>
                <Select
                  value={filters.transactionType}
                  onValueChange={(value) => handleFilterChange('transactionType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="BUY">Buy</SelectItem>
                    <SelectItem value="SELL">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Sort by:</label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transaction_date">Transaction Date</SelectItem>
                    <SelectItem value="created_at">Created Date</SelectItem>
                    <SelectItem value="quantity">Quantity</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Order:</label>
                <Select
                  value={filters.sortOrder}
                  onValueChange={(value) => handleFilterChange('sortOrder', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>

            <Separator className="mb-6" />
          </>
        )}

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions found matching your criteria.
          </div>
        ) : (
          <div style={{ maxHeight, overflowY: 'auto' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  {!positionId && <TableHead>Asset</TableHead>}
                  {!positionId && !portfolioId && <TableHead>Portfolio</TableHead>}
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(transaction.transaction_date), 'HH:mm')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTransactionBadgeVariant(transaction.type)}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    {!positionId && (
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{transaction.position?.symbol}</span>
                          <span className="text-xs text-gray-500">
                            {transaction.position?.name}
                          </span>
                        </div>
                      </TableCell>
                    )}
                    {!positionId && !portfolioId && (
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {transaction.position?.portfolio?.name}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {transaction.position?.portfolio?.asset_type?.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-right font-mono">
                      {transaction.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(transaction.price)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(transaction.quantity * transaction.price)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination for general transactions (not position/portfolio specific) */}
        {!positionId && !portfolioId && totalTransactions > pageSize && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, totalTransactions)} of {totalTransactions}{' '}
              transactions
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {Math.ceil(totalTransactions / pageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage >= Math.ceil(totalTransactions / pageSize)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}