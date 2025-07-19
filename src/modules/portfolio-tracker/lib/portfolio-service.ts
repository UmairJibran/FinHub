/**
 * Portfolio service functions for CRUD operations
 */

import { supabase, isSupabaseAvailable } from '../../../lib/supabase/client';
import type { 
  Portfolio, 
  PortfolioSummary,
  CreatePortfolioInput,
  UpdatePortfolioInput 
} from './types';
import type { 
  PortfolioInsert, 
  PortfolioUpdate 
} from '../../../lib/supabase/types';

// ============================================================================
// PORTFOLIO CRUD OPERATIONS
// ============================================================================

/**
 * Fetch all portfolios for the authenticated user
 */
export async function fetchPortfolios(): Promise<Portfolio[]> {
  if (!isSupabaseAvailable || !supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch portfolios: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch portfolio summaries with calculated metrics
 */
export async function fetchPortfolioSummaries(): Promise<PortfolioSummary[]> {
  if (!isSupabaseAvailable || !supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Fetch portfolios with position counts and totals
  const { data, error } = await supabase
    .from('portfolios')
    .select(`
      *,
      positions (
        id,
        quantity,
        average_cost,
        total_invested,
        current_price
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch portfolio summaries: ${error.message}`);
  }

  // Calculate summary metrics for each portfolio
  const summaries: PortfolioSummary[] = (data || []).map(portfolio => {
    const positions = portfolio.positions || [];
    const total_positions = positions.length;
    const total_invested = positions.reduce((sum, pos) => sum + pos.total_invested, 0);
    
    let current_value: number | undefined;
    let unrealized_gain_loss: number | undefined;
    let unrealized_gain_loss_percentage: number | undefined;

    // Calculate current value if all positions have current prices
    const hasAllCurrentPrices = positions.length > 0 && positions.every(pos => pos.current_price !== null);
    if (hasAllCurrentPrices) {
      current_value = positions.reduce((sum, pos) => {
        return sum + (pos.quantity * (pos.current_price || 0));
      }, 0);
      
      unrealized_gain_loss = current_value - total_invested;
      unrealized_gain_loss_percentage = total_invested > 0 
        ? (unrealized_gain_loss / total_invested) * 100 
        : 0;
    }

    return {
      ...portfolio,
      positions: undefined, // Remove positions array from summary
      total_positions,
      total_invested,
      current_value,
      unrealized_gain_loss,
      unrealized_gain_loss_percentage
    };
  });

  return summaries;
}

/**
 * Fetch a single portfolio by ID
 */
export async function fetchPortfolioById(id: string): Promise<Portfolio | null> {
  if (!isSupabaseAvailable || !supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Portfolio not found
    }
    throw new Error(`Failed to fetch portfolio: ${error.message}`);
  }

  return data;
}

/**
 * Create a new portfolio
 */
export async function createPortfolio(input: CreatePortfolioInput): Promise<Portfolio> {
  if (!isSupabaseAvailable || !supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const portfolioData: PortfolioInsert = {
    user_id: user.id,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    asset_type: input.asset_type
  };

  const { data, error } = await supabase
    .from('portfolios')
    .insert(portfolioData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create portfolio: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing portfolio
 */
export async function updatePortfolio(
  id: string, 
  input: UpdatePortfolioInput
): Promise<Portfolio> {
  if (!isSupabaseAvailable || !supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const updateData: PortfolioUpdate = {};
  
  if (input.name !== undefined) {
    updateData.name = input.name.trim();
  }
  
  if (input.description !== undefined) {
    updateData.description = input.description?.trim() || null;
  }

  const { data, error } = await supabase
    .from('portfolios')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update portfolio: ${error.message}`);
  }

  return data;
}

/**
 * Delete a portfolio and all its positions
 */
export async function deletePortfolio(id: string): Promise<void> {
  if (!isSupabaseAvailable || !supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('portfolios')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to delete portfolio: ${error.message}`);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a portfolio name is unique for the user
 */
export async function isPortfolioNameUnique(
  name: string, 
  excludeId?: string
): Promise<boolean> {
  if (!isSupabaseAvailable || !supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  let query = supabase
    .from('portfolios')
    .select('id')
    .eq('user_id', user.id)
    .ilike('name', name.trim());

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to check portfolio name: ${error.message}`);
  }

  return (data || []).length === 0;
}

/**
 * Get portfolio count for the user
 */
export async function getPortfolioCount(): Promise<number> {
  if (!isSupabaseAvailable || !supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { count, error } = await supabase
    .from('portfolios')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to get portfolio count: ${error.message}`);
  }

  return count || 0;
}