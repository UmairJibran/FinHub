/**
 * Position service functions for CRUD operations with cost basis calculations
 */

import { supabase, isSupabaseAvailable } from '../../../lib/supabase/client';
import type {
  Position,
  PositionWithMetrics,
  CreatePositionInput,
  UpdatePositionInput,
  Transaction,
  TransactionType,
} from './types';
import type {
  PositionInsert,
  PositionUpdate,
  TransactionInsert,
} from '../../../lib/supabase/types';
import {
  calculateNewAverageCost,
  calculateCostBasisAfterSale,
  calculatePositionMetrics,
  validatePositionUpdate,
  calculatePositionUpdateImpact,
} from './cost-basis-calculator';
import {
  createPositionCreationTransaction,
  createPositionUpdateTransactions,
} from './transaction-helpers';

// ============================================================================
// POSITION CRUD OPERATIONS
// ============================================================================

/**
 * Fetch all positions for a specific portfolio
 */
export async function fetchPositionsByPortfolio(portfolioId: string): Promise<Position[]> {
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

    // First verify the portfolio belongs to the user
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single();

    if (portfolioError || !portfolio) {
      throw new Error('Portfolio not found or access denied');
    }

    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch positions: ${error.message}`);
    }
    return data || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch positions with calculated metrics
 */
export async function fetchPositionsWithMetrics(portfolioId: string): Promise<PositionWithMetrics[]> {
  try {
    const positions = await fetchPositionsByPortfolio(portfolioId);
    
    return positions.map(position => {
      const metrics = calculatePositionMetrics(position, position.current_price || undefined);
      
      return {
        ...position,
        current_value: metrics.currentValue,
        unrealized_gain_loss: metrics.unrealizedGainLoss,
        unrealized_gain_loss_percentage: metrics.unrealizedGainLossPercentage,
      };
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch a single position by ID
 */
export async function fetchPositionById(id: string): Promise<Position | null> {
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

    // Fetch position with portfolio verification
    const { data, error } = await supabase
      .from('positions')
      .select(`
        *,
        portfolios!inner (
          id,
          user_id
        )
      `)
      .eq('id', id)
      .eq('portfolios.user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Position not found
      }
      throw new Error(`Failed to fetch position: ${error.message}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Create a new position with automatic cost basis calculation
 */
export async function createPosition(input: CreatePositionInput): Promise<Position> {
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

    // Verify portfolio belongs to user
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', input.portfolio_id)
      .eq('user_id', user.id)
      .single();

    if (portfolioError || !portfolio) {
      throw new Error('Portfolio not found or access denied');
    }

    // Check if position with same symbol already exists
    const { data: existingPosition } = await supabase
      .from('positions')
      .select('*')
      .eq('portfolio_id', input.portfolio_id)
      .eq('symbol', input.symbol.toUpperCase())
      .single();

    let positionData: PositionInsert;
    let transactionData: TransactionInsert;

    if (existingPosition) {
      // Update existing position with new average cost
      const costBasisResult = calculateNewAverageCost(
        existingPosition.quantity,
        existingPosition.average_cost,
        input.quantity,
        input.purchase_price
      );

      const newQuantity = existingPosition.quantity + input.quantity;

      // Update the existing position
      const { data: updatedPosition, error: updateError } = await supabase
        .from('positions')
        .update({
          quantity: newQuantity,
          average_cost: costBasisResult.averageCost,
          total_invested: costBasisResult.totalInvested,
          name: input.name, // Update name in case it changed
          current_price: input.current_price || existingPosition.current_price,
        })
        .eq('id', existingPosition.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update existing position: ${updateError.message}`);
      }

      // Create automatic transaction record
      await createPositionUpdateTransactions(
        existingPosition.id,
        existingPosition.quantity,
        newQuantity,
        existingPosition.average_cost,
        input.purchase_price
      );

      return updatedPosition;
    } else {
      // Create new position
      const totalInvested = input.quantity * input.purchase_price;

      positionData = {
        portfolio_id: input.portfolio_id,
        symbol: input.symbol.toUpperCase(),
        name: input.name,
        quantity: input.quantity,
        average_cost: input.purchase_price,
        total_invested: totalInvested,
        current_price: input.current_price || null,
      };

      const { data: newPosition, error: createError } = await supabase
        .from('positions')
        .insert(positionData)
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create position: ${createError.message}`);
      }

      // Create initial automatic transaction record
      await createPositionCreationTransaction(
        newPosition.id,
        input.quantity,
        input.purchase_price
      );

      return newPosition;
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Update an existing position with cost basis recalculation
 */
export async function updatePosition(
  id: string,
  input: UpdatePositionInput
): Promise<Position> {
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

    // Fetch current position
    const currentPosition = await fetchPositionById(id);
    if (!currentPosition) {
      throw new Error('Position not found');
    }

    const updateData: PositionUpdate = {};

    // Handle symbol update
    if (input.symbol !== undefined) {
      updateData.symbol = input.symbol.toUpperCase();
    }

    // Handle name update
    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    // Handle quantity and price updates with cost basis recalculation
    if (input.quantity !== undefined) {
      const validation = validatePositionUpdate(currentPosition, input.quantity, input.purchase_price);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const impact = calculatePositionUpdateImpact(
        currentPosition,
        input.quantity,
        input.purchase_price
      );

      updateData.quantity = input.quantity;
      updateData.average_cost = impact.newAverageCost;
      updateData.total_invested = impact.newTotalInvested;

      // Create automatic transaction record for the change
      if (impact.quantityChange !== 0) {
        await createPositionUpdateTransactions(
          id,
          currentPosition.quantity,
          input.quantity,
          currentPosition.average_cost,
          input.purchase_price
        );
      }
    }

    // Update the position
    const { data, error } = await supabase
      .from('positions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update position: ${error.message}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete a position while preserving transaction history
 */
export async function deletePosition(id: string): Promise<void> {
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

    // Verify position exists and belongs to user
    const position = await fetchPositionById(id);
    if (!position) {
      throw new Error('Position not found');
    }

    // Note: Transactions will be automatically deleted due to CASCADE constraint
    // But we could also choose to keep them for historical purposes
    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete position: ${error.message}`);
    }

  } catch (error) {
    throw error;
  }
}

// ============================================================================
// TRANSACTION OPERATIONS
// ============================================================================

/**
 * Fetch transaction history for a position
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
    const position = await fetchPositionById(positionId);
    if (!position) {
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
 * Fetch recent transactions across all portfolios for a user
 */
export async function fetchRecentTransactions(limit: number = 10): Promise<Transaction[]> {
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
          symbol,
          name,
          portfolios!inner (
            user_id
          )
        )
      `)
      .eq('positions.portfolios.user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent transactions: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a symbol exists in a portfolio
 */
export async function isSymbolExistsInPortfolio(
  portfolioId: string,
  symbol: string,
  excludePositionId?: string
): Promise<boolean> {
  try {
    if (!isSupabaseAvailable || !supabase) {
      throw new Error('Supabase is not configured');
    }

    let query = supabase
      .from('positions')
      .select('id')
      .eq('portfolio_id', portfolioId)
      .eq('symbol', symbol.toUpperCase());

    if (excludePositionId) {
      query = query.neq('id', excludePositionId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to check symbol existence: ${error.message}`);
    }

    return (data || []).length > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Get position count for a portfolio
 */
export async function getPositionCount(portfolioId: string): Promise<number> {
  try {
    if (!isSupabaseAvailable || !supabase) {
      throw new Error('Supabase is not configured');
    }

    const { count, error } = await supabase
      .from('positions')
      .select('*', { count: 'exact', head: true })
      .eq('portfolio_id', portfolioId);

    if (error) {
      throw new Error(`Failed to get position count: ${error.message}`);
    }

    return count || 0;
  } catch (error) {
    throw error;
  }
}