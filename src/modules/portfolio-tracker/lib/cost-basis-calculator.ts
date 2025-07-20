/**
 * Cost basis calculation utilities for position management
 */

import type { Position, Transaction, TransactionType } from './types';

// ============================================================================
// COST BASIS CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate new average cost basis when adding to an existing position
 */
export function calculateNewAverageCost(
  existingQuantity: number,
  existingAverageCost: number,
  newQuantity: number,
  newPrice: number
): { averageCost: number; totalInvested: number } {
  if (existingQuantity < 0 || newQuantity <= 0) {
    throw new Error('Quantities must be positive');
  }
  
  if (existingAverageCost < 0 || newPrice <= 0) {
    throw new Error('Prices must be positive');
  }

  const existingValue = existingQuantity * existingAverageCost;
  const newValue = newQuantity * newPrice;
  const totalQuantity = existingQuantity + newQuantity;
  const totalValue = existingValue + newValue;
  
  const averageCost = totalValue / totalQuantity;
  
  return {
    averageCost: Math.round(averageCost * 100000000) / 100000000, // Round to 8 decimal places
    totalInvested: Math.round(totalValue * 100) / 100 // Round to 2 decimal places
  };
}

/**
 * Calculate cost basis after selling part of a position
 */
export function calculateCostBasisAfterSale(
  currentQuantity: number,
  currentAverageCost: number,
  soldQuantity: number
): { remainingQuantity: number; averageCost: number; totalInvested: number } {
  if (currentQuantity <= 0 || soldQuantity <= 0) {
    throw new Error('Quantities must be positive');
  }
  
  if (soldQuantity > currentQuantity) {
    throw new Error('Cannot sell more than current quantity');
  }
  
  if (currentAverageCost <= 0) {
    throw new Error('Average cost must be positive');
  }

  const remainingQuantity = currentQuantity - soldQuantity;
  
  // Average cost remains the same for remaining shares
  const averageCost = currentAverageCost;
  const totalInvested = remainingQuantity * averageCost;
  
  return {
    remainingQuantity: Math.round(remainingQuantity * 100000000) / 100000000,
    averageCost: Math.round(averageCost * 100000000) / 100000000,
    totalInvested: Math.round(totalInvested * 100) / 100
  };
}

/**
 * Calculate cost basis from transaction history
 */
export function calculateCostBasisFromTransactions(
  transactions: Transaction[]
): { quantity: number; averageCost: number; totalInvested: number } {
  if (transactions.length === 0) {
    return { quantity: 0, averageCost: 0, totalInvested: 0 };
  }

  // Sort transactions by date
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
  );

  let totalQuantity = 0;
  let totalValue = 0;

  for (const transaction of sortedTransactions) {
    if (transaction.type === 'BUY') {
      totalQuantity += transaction.quantity;
      totalValue += transaction.quantity * transaction.price;
    } else if (transaction.type === 'SELL') {
      if (transaction.quantity > totalQuantity) {
        throw new Error('Cannot sell more than owned quantity');
      }
      
      // Calculate the cost basis of sold shares
      const averageCostAtSale = totalQuantity > 0 ? totalValue / totalQuantity : 0;
      const soldValue = transaction.quantity * averageCostAtSale;
      
      totalQuantity -= transaction.quantity;
      totalValue -= soldValue;
    }
  }

  const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

  return {
    quantity: Math.round(totalQuantity * 100000000) / 100000000,
    averageCost: Math.round(averageCost * 100000000) / 100000000,
    totalInvested: Math.round(totalValue * 100) / 100
  };
}

/**
 * Calculate position metrics including unrealized gains/losses
 */
export function calculatePositionMetrics(
  position: Position,
  currentPrice?: number
): {
  currentValue?: number;
  unrealizedGainLoss?: number;
  unrealizedGainLossPercentage?: number;
} {
  if (!currentPrice || currentPrice <= 0) {
    return {};
  }

  const currentValue = position.quantity * currentPrice;
  const unrealizedGainLoss = currentValue - position.total_invested;
  const unrealizedGainLossPercentage = 
    position.total_invested > 0 
      ? (unrealizedGainLoss / position.total_invested) * 100 
      : 0;

  return {
    currentValue: Math.round(currentValue * 100) / 100,
    unrealizedGainLoss: Math.round(unrealizedGainLoss * 100) / 100,
    unrealizedGainLossPercentage: Math.round(unrealizedGainLossPercentage * 100) / 100
  };
}

/**
 * Validate position update for cost basis consistency
 */
export function validatePositionUpdate(
  currentPosition: Position,
  newQuantity: number,
  newPrice?: number
): { isValid: boolean; error?: string } {
  if (newQuantity < 0) {
    return { isValid: false, error: 'Quantity cannot be negative' };
  }

  if (newPrice !== undefined && newPrice <= 0) {
    return { isValid: false, error: 'Price must be positive' };
  }

  // If reducing quantity, ensure it doesn't go below zero
  if (newQuantity < currentPosition.quantity) {
    const reduction = currentPosition.quantity - newQuantity;
    if (reduction > currentPosition.quantity) {
      return { isValid: false, error: 'Cannot reduce quantity below zero' };
    }
  }

  return { isValid: true };
}

/**
 * Calculate the impact of a position update on cost basis
 */
export function calculatePositionUpdateImpact(
  currentPosition: Position,
  newQuantity: number,
  newPrice?: number
): {
  newAverageCost: number;
  newTotalInvested: number;
  quantityChange: number;
  valueChange: number;
} {
  const quantityChange = newQuantity - currentPosition.quantity;
  
  if (quantityChange === 0) {
    // No quantity change, just price update
    return {
      newAverageCost: currentPosition.average_cost,
      newTotalInvested: currentPosition.total_invested,
      quantityChange: 0,
      valueChange: 0
    };
  }

  if (quantityChange > 0) {
    // Adding to position
    if (!newPrice || newPrice <= 0) {
      throw new Error('Price required when adding to position');
    }
    
    const result = calculateNewAverageCost(
      currentPosition.quantity,
      currentPosition.average_cost,
      quantityChange,
      newPrice
    );
    
    const valueChange = quantityChange * newPrice;
    
    return {
      newAverageCost: result.averageCost,
      newTotalInvested: result.totalInvested,
      quantityChange,
      valueChange
    };
  } else {
    // Reducing position
    const soldQuantity = Math.abs(quantityChange);
    const result = calculateCostBasisAfterSale(
      currentPosition.quantity,
      currentPosition.average_cost,
      soldQuantity
    );
    
    const valueChange = -(soldQuantity * currentPosition.average_cost);
    
    return {
      newAverageCost: result.averageCost,
      newTotalInvested: result.totalInvested,
      quantityChange,
      valueChange
    };
  }
}