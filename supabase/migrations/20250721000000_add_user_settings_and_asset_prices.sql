-- Add user settings and global asset prices tables
-- Migration for miscellaneous items task

-- Add currency column to user_profiles for user-level currency preference
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'USD';

-- Add currency column to portfolios for portfolio-specific currency
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Create global asset prices table for storing current prices
CREATE TABLE IF NOT EXISTS asset_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  current_price DECIMAL(20, 8) NOT NULL CHECK (current_price > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(symbol, currency)
);

-- Create index for asset prices
CREATE INDEX IF NOT EXISTS idx_asset_prices_symbol ON asset_prices(symbol);
CREATE INDEX IF NOT EXISTS idx_asset_prices_symbol_currency ON asset_prices(symbol, currency);

-- Enable RLS on asset_prices table
ALTER TABLE asset_prices ENABLE ROW LEVEL SECURITY;

-- Asset prices policies - all users can read, but only authenticated users can update
CREATE POLICY "Anyone can view asset prices" ON asset_prices 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert asset prices" ON asset_prices 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update asset prices" ON asset_prices 
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create trigger for asset_prices updated_at
CREATE TRIGGER update_asset_prices_updated_at BEFORE UPDATE ON asset_prices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update positions table to remove current_price requirement (will be fetched from asset_prices)
-- We'll keep the column but make it nullable and add a note that it's deprecated
COMMENT ON COLUMN positions.current_price IS 'DEPRECATED: Use asset_prices table instead';

-- Create a view for positions with current prices from asset_prices
CREATE OR REPLACE VIEW positions_with_prices AS
SELECT 
  p.*,
  ap.current_price as market_price,
  ap.last_updated as price_last_updated
FROM positions p
LEFT JOIN asset_prices ap ON p.symbol = ap.symbol AND ap.currency = COALESCE(
  (SELECT currency FROM portfolios WHERE id = p.portfolio_id),
  'USD'
);

-- Grant access to the view
GRANT SELECT ON positions_with_prices TO authenticated;
GRANT SELECT ON positions_with_prices TO anon;