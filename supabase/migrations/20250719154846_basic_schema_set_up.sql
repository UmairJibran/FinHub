-- Portfolio Tracker Database Schema
-- This file contains all the SQL commands to set up the database schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('stocks', 'crypto', 'mutual_funds', 'commodities', 'real_estate')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create positions table
CREATE TABLE IF NOT EXISTS positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL CHECK (quantity > 0),
  average_cost DECIMAL(20, 8) NOT NULL CHECK (average_cost > 0),
  total_invested DECIMAL(20, 2) NOT NULL CHECK (total_invested > 0),
  current_price DECIMAL(20, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
  quantity DECIMAL(20, 8) NOT NULL CHECK (quantity > 0),
  price DECIMAL(20, 8) NOT NULL CHECK (price > 0),
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_asset_type ON portfolios(asset_type);
CREATE INDEX IF NOT EXISTS idx_positions_portfolio_id ON positions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_position_id ON transactions(position_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies

-- User profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Portfolios: Users can only access their own portfolios
CREATE POLICY "Users can view own portfolios" ON portfolios 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolios" ON portfolios 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios" ON portfolios 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios" ON portfolios 
  FOR DELETE USING (auth.uid() = user_id);

-- Positions: Users can only access positions in their portfolios
CREATE POLICY "Users can view own positions" ON positions 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM portfolios WHERE id = portfolio_id
    )
  );

CREATE POLICY "Users can insert positions in own portfolios" ON positions 
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM portfolios WHERE id = portfolio_id
    )
  );

CREATE POLICY "Users can update own positions" ON positions 
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM portfolios WHERE id = portfolio_id
    )
  );

CREATE POLICY "Users can delete own positions" ON positions 
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM portfolios WHERE id = portfolio_id
    )
  );

-- Transactions: Users can only access transactions for their positions
CREATE POLICY "Users can view own transactions" ON transactions 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT p.user_id FROM portfolios p 
      JOIN positions pos ON p.id = pos.portfolio_id 
      WHERE pos.id = position_id
    )
  );

CREATE POLICY "Users can insert transactions for own positions" ON transactions 
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT p.user_id FROM portfolios p 
      JOIN positions pos ON p.id = pos.portfolio_id 
      WHERE pos.id = position_id
    )
  );

CREATE POLICY "Users can update own transactions" ON transactions 
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT p.user_id FROM portfolios p 
      JOIN positions pos ON p.id = pos.portfolio_id 
      WHERE pos.id = position_id
    )
  );

CREATE POLICY "Users can delete own transactions" ON transactions 
  FOR DELETE USING (
    auth.uid() IN (
      SELECT p.user_id FROM portfolios p 
      JOIN positions pos ON p.id = pos.portfolio_id 
      WHERE pos.id = position_id
    )
  );