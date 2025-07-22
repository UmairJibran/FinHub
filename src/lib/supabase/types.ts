// Database types for Supabase schema

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: UserProfileInsert;
        Update: UserProfileUpdate;
      };
      portfolios: {
        Row: Portfolio;
        Insert: PortfolioInsert;
        Update: PortfolioUpdate;
      };
      positions: {
        Row: Position;
        Insert: PositionInsert;
        Update: PositionUpdate;
      };
      transactions: {
        Row: Transaction;
        Insert: TransactionInsert;
        Update: TransactionUpdate;
      };
      asset_prices: {
        Row: AssetPrice;
        Insert: AssetPriceInsert;
        Update: AssetPriceUpdate;
      };
    };
    Views: {
      positions_with_prices: {
        Row: PositionWithPrice;
      };
    };
  };
}

// User Profile types
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  preferred_currency: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfileInsert {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  preferred_currency?: string;
}

export interface UserProfileUpdate {
  email?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  preferred_currency?: string;
}

// Portfolio types
export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  asset_type: AssetType;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioInsert {
  user_id: string;
  name: string;
  description?: string | null;
  asset_type: AssetType;
  currency?: string;
}

export interface PortfolioUpdate {
  name?: string;
  description?: string | null;
  asset_type?: AssetType;
  currency?: string;
}

// Position types
export interface Position {
  id: string;
  portfolio_id: string;
  symbol: string;
  name: string;
  quantity: number;
  average_cost: number;
  total_invested: number;
  current_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface PositionInsert {
  portfolio_id: string;
  symbol: string;
  name: string;
  quantity: number;
  average_cost: number;
  total_invested: number;
  current_price?: number | null;
}

export interface PositionUpdate {
  symbol?: string;
  name?: string;
  quantity?: number;
  average_cost?: number;
  total_invested?: number;
  current_price?: number | null;
}

// Transaction types
export interface Transaction {
  id: string;
  position_id: string;
  type: TransactionType;
  quantity: number;
  price: number;
  transaction_date: string;
  created_at: string;
}

export interface TransactionInsert {
  position_id: string;
  type: TransactionType;
  quantity: number;
  price: number;
  transaction_date: string;
}

export interface TransactionUpdate {
  type?: TransactionType;
  quantity?: number;
  price?: number;
  transaction_date?: string;
}

// Asset Price types
export interface AssetPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  currency: string;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface AssetPriceInsert {
  symbol: string;
  name: string;
  current_price: number;
  currency?: string;
}

export interface AssetPriceUpdate {
  name?: string;
  current_price?: number;
  currency?: string;
}

// Position with price view type
export interface PositionWithPrice extends Position {
  market_price: number | null;
  price_last_updated: string | null;
  currency?: string; // Currency from the portfolio
}

// Enums
export enum AssetType {
  STOCKS = 'stocks',
  CRYPTO = 'crypto',
  MUTUAL_FUNDS = 'mutual_funds',
  COMMODITIES = 'commodities',
  REAL_ESTATE = 'real_estate',
}

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
}

// Utility types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
