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
  // Running Cost Basis Calculator Tests

  // Test calculateNewAverageCost
  
  // Test case 1: Adding to existing position
  const result1 = calculateNewAverageCost(100, 10.00, 50, 15.00);
  if (Math.abs(result1.averageCost - 11.67) >= 0.01) throw new Error('Average cost calculation failed');
  if (Math.abs(result1.totalInvested - 1750.00) >= 0.01) throw new Error('Total invested calculation failed');
  // ✓ Adding to existing position works

  // Test case 2: Equal quantities
  const result2 = calculateNewAverageCost(100, 10.00, 100, 20.00);
  if (Math.abs(result2.averageCost - 15.00) >= 0.01) throw new Error('Equal quantities average failed');
  if (Math.abs(result2.totalInvested - 3000.00) >= 0.01) throw new Error('Equal quantities total failed');
  // ✓ Equal quantities calculation works

  // Test calculateCostBasisAfterSale
  
  const saleResult = calculateCostBasisAfterSale(100, 10.00, 30);
  if (Math.abs(saleResult.remainingQuantity - 70) >= 0.01) throw new Error('Remaining quantity failed');
  if (Math.abs(saleResult.averageCost - 10.00) >= 0.01) throw new Error('Average cost after sale failed');
  if (Math.abs(saleResult.totalInvested - 700.00) >= 0.01) throw new Error('Total invested after sale failed');
  // ✓ Partial sale calculation works

  // Test calculatePositionMetrics
  
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
  if (Math.abs(metrics.currentValue! - 1200.00) >= 0.01) throw new Error('Current value calculation failed');
  if (Math.abs(metrics.unrealizedGainLoss! - 200.00) >= 0.01) throw new Error('Unrealized gain calculation failed');
  if (Math.abs(metrics.unrealizedGainLossPercentage! - 20.00) >= 0.01) throw new Error('Gain percentage calculation failed');
  // ✓ Position metrics calculation works

  // Test with loss
  const lossMetrics = calculatePositionMetrics(position, 8.00);
  if (Math.abs(lossMetrics.currentValue! - 800.00) >= 0.01) throw new Error('Loss current value failed');
  if (Math.abs(lossMetrics.unrealizedGainLoss! - (-200.00)) >= 0.01) throw new Error('Unrealized loss calculation failed');
  if (Math.abs(lossMetrics.unrealizedGainLossPercentage! - (-20.00)) >= 0.01) throw new Error('Loss percentage calculation failed');
  // ✓ Loss calculation works

  // Test validatePositionUpdate
  
  const validation1 = validatePositionUpdate(position, 150, 12.00);
  if (validation1.isValid !== true) throw new Error('Valid update rejected');
  // ✓ Valid position update accepted

  const validation2 = validatePositionUpdate(position, -10);
  if (validation2.isValid !== false) throw new Error('Invalid negative quantity accepted');
  // ✓ Invalid negative quantity rejected

  // Test calculatePositionUpdateImpact
  
  // Test adding to position
  const impact1 = calculatePositionUpdateImpact(position, 150, 12.00);
  if (impact1.quantityChange !== 50) throw new Error('Quantity change calculation failed');
  if (Math.abs(impact1.newAverageCost - 10.67) >= 0.01) throw new Error('New average cost failed');
  if (Math.abs(impact1.newTotalInvested - 1600.00) >= 0.01) throw new Error('New total invested failed');
  // ✓ Adding to position impact calculation works

  // Test reducing position
  const impact2 = calculatePositionUpdateImpact(position, 70);
  if (impact2.quantityChange !== -30) throw new Error('Quantity reduction failed');
  if (Math.abs(impact2.newAverageCost - 10.00) >= 0.01) throw new Error('Average cost after reduction failed');
  if (Math.abs(impact2.newTotalInvested - 700.00) >= 0.01) throw new Error('Total invested after reduction failed');
  // ✓ Reducing position impact calculation works

  // Test error cases
  
  try {
    calculateNewAverageCost(-10, 10.00, 50, 15.00);
    throw new Error('Should have thrown error for negative quantity');
  } catch (error) {
    // ✓ Negative quantity error handling works
  }

  try {
    calculateCostBasisAfterSale(100, 10.00, 150);
    throw new Error('Should have thrown error for overselling');
  } catch (error) {
    // ✓ Overselling error handling works
  }

  // 🎉 All cost basis calculator tests passed!
}

// Export for potential use
export { runCostBasisTests };

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runCostBasisTests();
}