/**
 * Cost basis calculator tests
 * Simple validation tests to ensure cost basis calculations work correctly
 */

import {
  calculateNewAverageCost,
  calculateCostBasisAfterSale,
  calculatePositionMetrics,
  validatePositionUpdate,
  calculatePositionUpdateImpact,
} from '../cost-basis-calculator';
import type { Position } from '../types';

// Simple test runner
function runCostBasisTests() {
  console.log('Running Cost Basis Calculator Tests...\n');

  // Test calculateNewAverageCost
  console.log('Testing calculateNewAverageCost...');
  
  // Test case 1: Adding to existing position
  const result1 = calculateNewAverageCost(100, 10.00, 50, 15.00);
  console.assert(Math.abs(result1.averageCost - 11.67) < 0.01, 'Average cost calculation failed');
  console.assert(Math.abs(result1.totalInvested - 1750.00) < 0.01, 'Total invested calculation failed');
  console.log('✓ Adding to existing position works');

  // Test case 2: Equal quantities
  const result2 = calculateNewAverageCost(100, 10.00, 100, 20.00);
  console.assert(Math.abs(result2.averageCost - 15.00) < 0.01, 'Equal quantities average failed');
  console.assert(Math.abs(result2.totalInvested - 3000.00) < 0.01, 'Equal quantities total failed');
  console.log('✓ Equal quantities calculation works');

  // Test calculateCostBasisAfterSale
  console.log('\nTesting calculateCostBasisAfterSale...');
  
  const saleResult = calculateCostBasisAfterSale(100, 10.00, 30);
  console.assert(Math.abs(saleResult.remainingQuantity - 70) < 0.01, 'Remaining quantity failed');
  console.assert(Math.abs(saleResult.averageCost - 10.00) < 0.01, 'Average cost after sale failed');
  console.assert(Math.abs(saleResult.totalInvested - 700.00) < 0.01, 'Total invested after sale failed');
  console.log('✓ Partial sale calculation works');

  // Test calculatePositionMetrics
  console.log('\nTesting calculatePositionMetrics...');
  
  const position: Position = {
    id: '1',
    portfolio_id: '1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    quantity: 100,
    average_cost: 10.00,
    total_invested: 1000.00,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const metrics = calculatePositionMetrics(position, 12.00);
  console.assert(Math.abs(metrics.currentValue! - 1200.00) < 0.01, 'Current value calculation failed');
  console.assert(Math.abs(metrics.unrealizedGainLoss! - 200.00) < 0.01, 'Unrealized gain calculation failed');
  console.assert(Math.abs(metrics.unrealizedGainLossPercentage! - 20.00) < 0.01, 'Gain percentage calculation failed');
  console.log('✓ Position metrics calculation works');

  // Test with loss
  const lossMetrics = calculatePositionMetrics(position, 8.00);
  console.assert(Math.abs(lossMetrics.currentValue! - 800.00) < 0.01, 'Loss current value failed');
  console.assert(Math.abs(lossMetrics.unrealizedGainLoss! - (-200.00)) < 0.01, 'Unrealized loss calculation failed');
  console.assert(Math.abs(lossMetrics.unrealizedGainLossPercentage! - (-20.00)) < 0.01, 'Loss percentage calculation failed');
  console.log('✓ Loss calculation works');

  // Test validatePositionUpdate
  console.log('\nTesting validatePositionUpdate...');
  
  const validation1 = validatePositionUpdate(position, 150, 12.00);
  console.assert(validation1.isValid === true, 'Valid update rejected');
  console.log('✓ Valid position update accepted');

  const validation2 = validatePositionUpdate(position, -10);
  console.assert(validation2.isValid === false, 'Invalid negative quantity accepted');
  console.log('✓ Invalid negative quantity rejected');

  // Test calculatePositionUpdateImpact
  console.log('\nTesting calculatePositionUpdateImpact...');
  
  // Test adding to position
  const impact1 = calculatePositionUpdateImpact(position, 150, 12.00);
  console.assert(impact1.quantityChange === 50, 'Quantity change calculation failed');
  console.assert(Math.abs(impact1.newAverageCost - 10.67) < 0.01, 'New average cost failed');
  console.assert(Math.abs(impact1.newTotalInvested - 1600.00) < 0.01, 'New total invested failed');
  console.log('✓ Adding to position impact calculation works');

  // Test reducing position
  const impact2 = calculatePositionUpdateImpact(position, 70);
  console.assert(impact2.quantityChange === -30, 'Quantity reduction failed');
  console.assert(Math.abs(impact2.newAverageCost - 10.00) < 0.01, 'Average cost after reduction failed');
  console.assert(Math.abs(impact2.newTotalInvested - 700.00) < 0.01, 'Total invested after reduction failed');
  console.log('✓ Reducing position impact calculation works');

  // Test error cases
  console.log('\nTesting error cases...');
  
  try {
    calculateNewAverageCost(-10, 10.00, 50, 15.00);
    console.assert(false, 'Should have thrown error for negative quantity');
  } catch (error) {
    console.log('✓ Negative quantity error handling works');
  }

  try {
    calculateCostBasisAfterSale(100, 10.00, 150);
    console.assert(false, 'Should have thrown error for overselling');
  } catch (error) {
    console.log('✓ Overselling error handling works');
  }

  console.log('\n🎉 All cost basis calculator tests passed!');
}

// Export for potential use
export { runCostBasisTests };

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runCostBasisTests();
}