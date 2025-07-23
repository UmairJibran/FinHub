/**
 * Type validation tests for Portfolio Tracker
 * Simple validation tests to ensure types work correctly
 */

import {
  AssetType,
  TransactionType,
  AssetTypeLabels,
  CreatePortfolioSchema,
  CreatePositionSchema,
  LoginFormSchema,
  isValidUUID,
  isValidAmount,
  isValidQuantity,
  isValidSymbol,
  ApiErrorCode,
  isSuccessResponse,
  isErrorResponse
} from '../index';

// Simple test runner
function runTests() {
  // Running Portfolio Tracker Type Tests

  // Test Enums
  // ✓ AssetType enum values are correct
  if (AssetType.STOCKS !== 'stocks') throw new Error('AssetType.STOCKS test failed');
  if (AssetType.CRYPTO !== 'crypto') throw new Error('AssetType.CRYPTO test failed');
  if (AssetType.MUTUAL_FUNDS !== 'mutual_funds') throw new Error('AssetType.MUTUAL_FUNDS test failed');

  // ✓ TransactionType enum values are correct
  if (TransactionType.BUY !== 'BUY') throw new Error('TransactionType.BUY test failed');
  if (TransactionType.SELL !== 'SELL') throw new Error('TransactionType.SELL test failed');

  // ✓ AssetTypeLabels are correct
  if (AssetTypeLabels[AssetType.STOCKS] !== 'Stocks') throw new Error('AssetTypeLabels.STOCKS test failed');
  if (AssetTypeLabels[AssetType.CRYPTO] !== 'Cryptocurrency') throw new Error('AssetTypeLabels.CRYPTO test failed');

  // Test Validation Schemas
  const validPortfolio = {
    name: 'My Stocks',
    description: 'Stock investments',
    asset_type: AssetType.STOCKS
  };
  const portfolioResult = CreatePortfolioSchema.safeParse(validPortfolio);
  if (portfolioResult.success !== true) throw new Error('Portfolio validation schema test failed');
  // ✓ Portfolio validation schema works

  const invalidPortfolio = {
    name: '', // Empty name
    asset_type: 'invalid_type'
  };
  const invalidPortfolioResult = CreatePortfolioSchema.safeParse(invalidPortfolio);
  if (invalidPortfolioResult.success !== false) throw new Error('Portfolio validation rejection test failed');
  // ✓ Portfolio validation rejects invalid data

  const validPosition = {
    portfolio_id: '123e4567-e89b-12d3-a456-426614174000',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    quantity: 10,
    purchase_price: 150.50
  };
  const positionResult = CreatePositionSchema.safeParse(validPosition);
  if (positionResult.success !== true) throw new Error('Position validation schema test failed');
  // ✓ Position validation schema works

  const validLogin = {
    email: 'test@example.com',
    password: 'password123'
  };
  const loginResult = LoginFormSchema.safeParse(validLogin);
  if (loginResult.success !== true) throw new Error('Login form validation test failed');
  // ✓ Login form validation works

  // Test Validation Helpers
  if (isValidUUID('123e4567-e89b-12d3-a456-426614174000') !== true) throw new Error('UUID validation test failed');
  if (isValidUUID('invalid-uuid') !== false) throw new Error('UUID validation rejection test failed');
  // ✓ UUID validation helper works

  if (isValidAmount(100.50) !== true) throw new Error('Amount validation test failed');
  if (isValidAmount(-50) !== false) throw new Error('Amount validation negative test failed');
  if (isValidAmount(0) !== false) throw new Error('Amount validation zero test failed');
  // ✓ Amount validation helper works

  if (isValidQuantity(10.5) !== true) throw new Error('Quantity validation test failed');
  if (isValidQuantity(0.00000001) !== true) throw new Error('Quantity validation small test failed');
  if (isValidQuantity(-5) !== false) throw new Error('Quantity validation negative test failed');
  // ✓ Quantity validation helper works

  if (isValidSymbol('AAPL') !== true) throw new Error('Symbol validation test failed');
  if (isValidSymbol('') !== false) throw new Error('Symbol validation empty test failed');
  // ✓ Symbol validation helper works

  // Test API Type Guards
  const successResponse = {
    success: true as const,
    data: { id: '1', name: 'Test' },
    timestamp: new Date().toISOString()
  };
  if (isSuccessResponse(successResponse) !== true) throw new Error('Success response type guard test failed');
  // ✓ Success response type guard works

  const errorResponse = {
    success: false as const,
    error: {
      code: ApiErrorCode.VALIDATION_ERROR,
      message: 'Validation failed'
    },
    timestamp: new Date().toISOString()
  };
  if (isErrorResponse(errorResponse) !== true) throw new Error('Error response type guard test failed');
  // ✓ Error response type guard works

  // 🎉 All type tests passed!
}

// Export for potential use
export { runTests };

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests();
}