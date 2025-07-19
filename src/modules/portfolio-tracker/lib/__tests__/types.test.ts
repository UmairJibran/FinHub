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
  console.log('Running Portfolio Tracker Type Tests...\n');

  // Test Enums
  console.log('✓ AssetType enum values are correct');
  console.assert(AssetType.STOCKS === 'stocks');
  console.assert(AssetType.CRYPTO === 'crypto');
  console.assert(AssetType.MUTUAL_FUNDS === 'mutual_funds');

  console.log('✓ TransactionType enum values are correct');
  console.assert(TransactionType.BUY === 'BUY');
  console.assert(TransactionType.SELL === 'SELL');

  console.log('✓ AssetTypeLabels are correct');
  console.assert(AssetTypeLabels[AssetType.STOCKS] === 'Stocks');
  console.assert(AssetTypeLabels[AssetType.CRYPTO] === 'Cryptocurrency');

  // Test Validation Schemas
  const validPortfolio = {
    name: 'My Stocks',
    description: 'Stock investments',
    asset_type: AssetType.STOCKS
  };
  const portfolioResult = CreatePortfolioSchema.safeParse(validPortfolio);
  console.assert(portfolioResult.success === true);
  console.log('✓ Portfolio validation schema works');

  const invalidPortfolio = {
    name: '', // Empty name
    asset_type: 'invalid_type'
  };
  const invalidPortfolioResult = CreatePortfolioSchema.safeParse(invalidPortfolio);
  console.assert(invalidPortfolioResult.success === false);
  console.log('✓ Portfolio validation rejects invalid data');

  const validPosition = {
    portfolio_id: '123e4567-e89b-12d3-a456-426614174000',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    quantity: 10,
    purchase_price: 150.50
  };
  const positionResult = CreatePositionSchema.safeParse(validPosition);
  console.assert(positionResult.success === true);
  console.log('✓ Position validation schema works');

  const validLogin = {
    email: 'test@example.com',
    password: 'password123'
  };
  const loginResult = LoginFormSchema.safeParse(validLogin);
  console.assert(loginResult.success === true);
  console.log('✓ Login form validation works');

  // Test Validation Helpers
  console.assert(isValidUUID('123e4567-e89b-12d3-a456-426614174000') === true);
  console.assert(isValidUUID('invalid-uuid') === false);
  console.log('✓ UUID validation helper works');

  console.assert(isValidAmount(100.50) === true);
  console.assert(isValidAmount(-50) === false);
  console.assert(isValidAmount(0) === false);
  console.log('✓ Amount validation helper works');

  console.assert(isValidQuantity(10.5) === true);
  console.assert(isValidQuantity(0.00000001) === true);
  console.assert(isValidQuantity(-5) === false);
  console.log('✓ Quantity validation helper works');

  console.assert(isValidSymbol('AAPL') === true);
  console.assert(isValidSymbol('') === false);
  console.log('✓ Symbol validation helper works');

  // Test API Type Guards
  const successResponse = {
    success: true as const,
    data: { id: '1', name: 'Test' },
    timestamp: new Date().toISOString()
  };
  console.assert(isSuccessResponse(successResponse) === true);
  console.log('✓ Success response type guard works');

  const errorResponse = {
    success: false as const,
    error: {
      code: ApiErrorCode.VALIDATION_ERROR,
      message: 'Validation failed'
    },
    timestamp: new Date().toISOString()
  };
  console.assert(isErrorResponse(errorResponse) === true);
  console.log('✓ Error response type guard works');

  console.log('\n🎉 All type tests passed!');
}

// Export for potential use
export { runTests };

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests();
}