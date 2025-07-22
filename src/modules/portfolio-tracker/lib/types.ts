/**
 * Core TypeScript interfaces and types for Portfolio Tracker
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Supported asset types for portfolio categorization
 */
export enum AssetType {
  STOCKS = 'stocks',
  CRYPTO = 'crypto',
  MUTUAL_FUNDS = 'mutual_funds',
  COMMODITIES = 'commodities',
  REAL_ESTATE = 'real_estate'
}

/**
 * Transaction types for position tracking
 */
export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL'
}

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * User interface extending Supabase auth user
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Portfolio account interface for organizing investments by asset type
 */
export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  asset_type: AssetType;
  currency: string;
  created_at: string;
  updated_at: string;
}

/**
 * Investment position interface with cost basis tracking
 */
export interface Position {
  id: string;
  portfolio_id: string;
  symbol: string;
  name: string;
  quantity: number;
  average_cost: number;
  total_invested: number;
  current_price?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Transaction record for audit trail and cost basis calculations
 */
export interface Transaction {
  id: string;
  position_id: string;
  type: TransactionType;
  quantity: number;
  price: number;
  transaction_date: string;
  created_at: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Asset type labels for UI display
 */
export const AssetTypeLabels: Record<AssetType, string> = {
  [AssetType.STOCKS]: 'Stocks',
  [AssetType.CRYPTO]: 'Cryptocurrency',
  [AssetType.MUTUAL_FUNDS]: 'Mutual Funds',
  [AssetType.COMMODITIES]: 'Commodities',
  [AssetType.REAL_ESTATE]: 'Real Estate'
};

/**
 * Portfolio creation input type (omits generated fields)
 */
export type CreatePortfolioInput = Omit<Portfolio, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

/**
 * Portfolio update input type (omits immutable fields)
 */
export type UpdatePortfolioInput = Partial<Pick<Portfolio, 'name' | 'description'>>;

/**
 * Position creation input type (omits calculated and generated fields)
 */
export type CreatePositionInput = Omit<Position, 'id' | 'average_cost' | 'total_invested' | 'created_at' | 'updated_at'> & {
  purchase_price: number;
};

/**
 * Position update input type for editing existing positions
 */
export type UpdatePositionInput = Partial<Pick<Position, 'symbol' | 'name' | 'quantity'>> & {
  purchase_price?: number;
};

/**
 * Transaction creation input type
 */
export type CreateTransactionInput = Omit<Transaction, 'id' | 'created_at'>;

// ============================================================================
// CALCULATED TYPES
// ============================================================================

/**
 * Portfolio summary with calculated metrics
 */
export interface PortfolioSummary extends Portfolio {
  total_positions: number;
  total_invested: number;
  current_value?: number;
  unrealized_gain_loss?: number;
  unrealized_gain_loss_percentage?: number;
}

/**
 * Position with calculated performance metrics
 */
export interface PositionWithMetrics extends Position {
  current_value?: number;
  unrealized_gain_loss?: number;
  unrealized_gain_loss_percentage?: number;
  allocation_percentage?: number;
}

/**
 * Dashboard analytics data
 */
export interface DashboardAnalytics {
  total_portfolio_value: number;
  total_invested: number;
  total_unrealized_gain_loss: number;
  total_unrealized_gain_loss_percentage: number;
  asset_allocation: AssetAllocation[];
  recent_transactions: Transaction[];
  portfolio_summaries: PortfolioSummary[];
}

/**
 * Asset allocation data for charts
 */
export interface AssetAllocation {
  asset_type: AssetType;
  label: string;
  value: number;
  percentage: number;
  color: string;
}

// ============================================================================
// API TYPES (Basic types - detailed API types are in api-types.ts)
// ============================================================================

/**
 * Basic API response wrapper for simple use cases
 */
export interface SimpleApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  message?: string;
}

/**
 * Query parameters for filtering and pagination
 */
export interface QueryParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
  asset_type?: AssetType;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Login form data
 */
export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Portfolio form data
 */
export interface PortfolioFormData {
  name: string;
  description?: string;
  asset_type: AssetType;
  currency: string;
}

/**
 * Position form data
 */
export interface PositionFormData {
  symbol: string;
  name: string;
  quantity: number;
  purchase_price: number;
  portfolio_id: string;
}

/**
 * Transaction form data
 */
export interface TransactionFormData {
  position_id: string;
  type: TransactionType;
  quantity: number;
  price: number;
  transaction_date: string;
}

// ============================================================================
// STATE TYPES
// ============================================================================

/**
 * Authentication state
 */
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

/**
 * Loading states for async operations
 */
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Form state for handling form submissions
 */
export interface FormState<T = any> extends LoadingState {
  data: T;
  isDirty: boolean;
  isValid: boolean;
  errors: Record<string, string>;
}