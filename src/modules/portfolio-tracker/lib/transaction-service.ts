/**
 * Transaction service functions for recording buy/sell operations and audit trail
 */

import { supabase, isSupabaseAvailable } from '../../../lib/supabase/client';
import type {
  Transaction,
  CreateTransactionInput,
  TransactionType,
  QueryParams,
} from './types';
import type { TransactionInsert } from '../../../lib/supabase/types';

// ============================================================================
// TRANSACTION QUERY INTERFACES
// ============================================================================

export interface TransactionQueryParams extends QueryParams {
  position_id?: string;
  portfolio_id?: string;
  transaction_type?: TransactionType;
  start_date?: string;
  end_date?: string;
  symbol?: string;
}

export interface TransactionWithDetails extends Transaction {
  position: {
    id: string;
    symbol: string;
    name: string;
    portfolio: {
      id: string;
      name: string;
      asset_type: string;
    };
  };
}

// ============================================================================
// TRANSACTION CRUD OPERATIONS
// ============================================================================

/**
 * Create a new transaction record
 */
export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  try {
    if (!isSupabaseAvailable || !supabase) {
      throw new Error('Supabase is not configured');
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Verify position belongs to user
    const { data: position, error: positionError } = await supabase
      .from('positions')
      .select(`
        id,
        portfolios!inner (
          id,
          user_id
        )
      `)
      .eq('id', input.position_id)
      .eq('portfolios.user_id', user.id)
      .single();

    if (positionError || !position) {
      throw new Error('Position not found or access denied');
    }

    const transactionData: TransactionInsert = {
      position_id: input.position_id,
      type: input.type,
      quantity: input.quantity,
      price: input.price,
      transaction_date: input.transaction_date,
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch transactions with optional filtering and pagination
 */
export async function fetchTransactions(params: TransactionQueryParams = {}): Promise<{
  transactions: TransactionWithDetails[];
  total: number;
}> {
  try {
    if (!isSupabaseAvailable || !supabase) {
      throw new Error('Supabase is not configured');
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Build the query
    let query = supabase
      .from('transactions')
      .select(`
        *,
        positions!inner (
          id,
          symbol,
          name,
          portfolios!inner (
            id,
            name,
            asset_type,
            user_id
          )
        )
      `, { count: 'exact' })
      .eq('positions.portfolios.user_id', user.id);

    // Apply filters
    if (params.position_id) {
      query = query.eq('position_id', params.position_id);
    }

    if (params.portfolio_id) {
      query = query.eq('positions.portfolio_id', params.portfolio_id);
    }

    if (params.transaction_type) {
      query = query.eq('type', params.transaction_type);
    }

    if (params.symbol) {
      query = query.ilike('positions.symbol', `%${params.symbol}%`);
    }

    if (params.start_date) {
      query = query.gte('transaction_date', params.start_date);
    }

    if (params.end_date) {
      query = query.lte('transaction_date', params.end_date);
    }

    if (params.search) {
      query = query.or(`positions.symbol.ilike.%${params.search}%,positions.name.ilike.%${params.search}%`);
    }

    // Apply sorting
    const sortBy = params.sort_by || 'transaction_date';
    const sortOrder = params.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    // Transform the data to match our interface
    const transactions: TransactionWithDetails[] = (data || []).map((item: any) => ({
      id: item.id,
      position_id: item.position_id,
      type: item.type,
      quantity: item.quantity,
      price: item.price,
      transaction_date: item.transaction_date,
      created_at: item.created_at,
      position: {
        id: item.positions.id,
        symbol: item.positions.symbol,
        name: item.positions.name,
        portfolio: {
          id: item.positions.portfolios.id,
          name: item.positions.portfolios.name,
          asset_type: item.positions.portfolios.asset_type,
        },
      },
    }));

    return {
      transactions,
      total: count || 0,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch transactions for a specific position
 */
export async function fetchTransactionsByPosition(positionId: string): Promise<Transaction[]> {
  try {
    if (!isSupabaseAvailable || !supabase) {
      throw new Error('Supabase is not configured');
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Verify position belongs to user
    const { data: position, error: positionError } = await supabase
      .from('positions')
      .select(`
        id,
        portfolios!inner (
          user_id
        )
      `)
      .eq('id', positionId)
      .eq('portfolios.user_id', user.id)
      .single();

    if (positionError || !position) {
      throw new Error('Position not found or access denied');
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('position_id', positionId)
      .order('transaction_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch transactions for a specific portfolio
 */
export async function fetchTransactionsByPortfolio(portfolioId: string): Promise<TransactionWithDetails[]> {
  try {
    const result = await fetchTransactions({ 
      portfolio_id: portfolioId,
      limit: 1000, // Get all transactions for the portfolio
    });
    return result.transactions;
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch recent transactions across all portfolios
 */
export async function fetchRecentTransactions(limit: number = 10): Promise<TransactionWithDetails[]> {
  try {
    const result = await fetchTransactions({ 
      limit,
      sort_by: 'created_at',
      sort_order: 'desc',
    });
    return result.transactions;
  } catch (error) {
    throw error;
  }
}

/**
 * Get transaction by ID
 */
export async function fetchTransactionById(id: string): Promise<TransactionWithDetails | null> {
  try {
    if (!isSupabaseAvailable || !supabase) {
      throw new Error('Supabase is not configured');
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        positions!inner (
          id,
          symbol,
          name,
          portfolios!inner (
            id,
            name,
            asset_type,
            user_id
          )
        )
      `)
      .eq('id', id)
      .eq('positions.portfolios.user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Transaction not found
      }
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }

    // Transform the data
    const transaction: TransactionWithDetails = {
      id: data.id,
      position_id: data.position_id,
      type: data.type,
      quantity: data.quantity,
      price: data.price,
      transaction_date: data.transaction_date,
      created_at: data.created_at,
      position: {
        id: data.positions.id,
        symbol: data.positions.symbol,
        name: data.positions.name,
        portfolio: {
          id: data.positions.portfolios.id,
          name: data.positions.portfolios.name,
          asset_type: data.positions.portfolios.asset_type,
        },
      },
    };

    return transaction;
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// TRANSACTION ANALYTICS
// ============================================================================

/**
 * Get transaction statistics for a user
 */
export async function getTransactionStats(): Promise<{
  total_transactions: number;
  total_buy_transactions: number;
  total_sell_transactions: number;
  total_buy_volume: number;
  total_sell_volume: number;
  recent_activity_count: number;
}> {
  try {
    if (!isSupabaseAvailable || !supabase) {
      throw new Error('Supabase is not configured');
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get all transactions for the user
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        type,
        quantity,
        price,
        created_at,
        positions!inner (
          portfolios!inner (
            user_id
          )
        )
      `)
      .eq('positions.portfolios.user_id', user.id);

    if (error) {
      throw new Error(`Failed to fetch transaction stats: ${error.message}`);
    }

    const transactions = data || [];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = transactions.reduce(
      (acc, transaction) => {
        acc.total_transactions++;
        
        const volume = transaction.quantity * transaction.price;
        
        if (transaction.type === 'BUY') {
          acc.total_buy_transactions++;
          acc.total_buy_volume += volume;
        } else {
          acc.total_sell_transactions++;
          acc.total_sell_volume += volume;
        }

        // Check if transaction is recent (within 7 days)
        const transactionDate = new Date(transaction.created_at);
        if (transactionDate >= sevenDaysAgo) {
          acc.recent_activity_count++;
        }

        return acc;
      },
      {
        total_transactions: 0,
        total_buy_transactions: 0,
        total_sell_transactions: 0,
        total_buy_volume: 0,
        total_sell_volume: 0,
        recent_activity_count: 0,
      }
    );

    return stats;
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Delete a transaction (admin function - use with caution)
 */
export async function deleteTransaction(id: string): Promise<void> {
  try {
    if (!isSupabaseAvailable || !supabase) {
      throw new Error('Supabase is not configured');
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Verify transaction belongs to user
    const transaction = await fetchTransactionById(id);
    if (!transaction) {
      throw new Error('Transaction not found or access denied');
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete transaction: ${error.message}`);
    }

  } catch (error) {
    throw error;
  }
}

/**
 * Get transaction count for a position
 */
export async function getTransactionCount(positionId: string): Promise<number> {
  try {
    if (!isSupabaseAvailable || !supabase) {
      throw new Error('Supabase is not configured');
    }

    const { count, error } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('position_id', positionId);

    if (error) {
      throw new Error(`Failed to get transaction count: ${error.message}`);
    }

    return count || 0;
  } catch (error) {
    throw error;
  }
}