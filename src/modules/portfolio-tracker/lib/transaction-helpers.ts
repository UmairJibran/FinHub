/**
 * Helper functions for automatic transaction creation
 */

import { supabase } from '../../../lib/supabase/client';
import type { TransactionInsert } from '../../../lib/supabase/types';
import type { TransactionType } from './types';

// ============================================================================
// AUTOMATIC TRANSACTION CREATION
// ============================================================================

/**
 * Create a transaction record automatically when positions are modified
 */
export async function createAutomaticTransaction(
  positionId: string,
  type: TransactionType,
  quantity: number,
  price: number,
  transactionDate?: string
): Promise<void> {
  try {
    const transactionData: TransactionInsert = {
      position_id: positionId,
      type,
      quantity,
      price,
      transaction_date: transactionDate || new Date().toISOString(),
    };

    const { error } = await supabase
      .from('transactions')
      .insert(transactionData);

    if (error) {
      console.error('Failed to create automatic transaction:', error);
      // Don't throw here as we don't want to break the main operation
    } else {
      console.log('Automatic transaction created:', { type, quantity, price });
    }
  } catch (error) {
    console.error('Error in createAutomaticTransaction:', error);
    // Don't throw here as we don't want to break the main operation
  }
}

/**
 * Create multiple transaction records for position updates
 */
export async function createBulkAutomaticTransactions(
  transactions: Array<{
    positionId: string;
    type: TransactionType;
    quantity: number;
    price: number;
    transactionDate?: string;
  }>
): Promise<void> {
  try {
    const transactionData: TransactionInsert[] = transactions.map(tx => ({
      position_id: tx.positionId,
      type: tx.type,
      quantity: tx.quantity,
      price: tx.price,
      transaction_date: tx.transactionDate || new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('transactions')
      .insert(transactionData);

    if (error) {
      console.error('Failed to create bulk automatic transactions:', error);
    } else {
      console.log('Bulk automatic transactions created:', transactions.length);
    }
  } catch (error) {
    console.error('Error in createBulkAutomaticTransactions:', error);
  }
}

/**
 * Create transaction for position creation
 */
export async function createPositionCreationTransaction(
  positionId: string,
  quantity: number,
  purchasePrice: number
): Promise<void> {
  await createAutomaticTransaction(
    positionId,
    'BUY',
    quantity,
    purchasePrice
  );
}

/**
 * Create transaction for position quantity increase
 */
export async function createPositionIncreaseTransaction(
  positionId: string,
  quantityIncrease: number,
  purchasePrice: number
): Promise<void> {
  await createAutomaticTransaction(
    positionId,
    'BUY',
    quantityIncrease,
    purchasePrice
  );
}

/**
 * Create transaction for position quantity decrease
 */
export async function createPositionDecreaseTransaction(
  positionId: string,
  quantityDecrease: number,
  sellPrice: number
): Promise<void> {
  await createAutomaticTransaction(
    positionId,
    'SELL',
    quantityDecrease,
    sellPrice
  );
}

/**
 * Create transactions for position updates that involve both buying and selling
 */
export async function createPositionUpdateTransactions(
  positionId: string,
  oldQuantity: number,
  newQuantity: number,
  oldAverageCost: number,
  newPurchasePrice?: number
): Promise<void> {
  const quantityChange = newQuantity - oldQuantity;
  
  if (quantityChange > 0) {
    // Quantity increased - create BUY transaction
    const purchasePrice = newPurchasePrice || oldAverageCost;
    await createPositionIncreaseTransaction(positionId, quantityChange, purchasePrice);
  } else if (quantityChange < 0) {
    // Quantity decreased - create SELL transaction
    const sellQuantity = Math.abs(quantityChange);
    await createPositionDecreaseTransaction(positionId, sellQuantity, oldAverageCost);
  }
  // If quantityChange === 0, no transaction needed
}

// ============================================================================
// TRANSACTION VALIDATION
// ============================================================================

/**
 * Validate if a sell transaction is possible
 */
export function validateSellTransaction(
  currentQuantity: number,
  sellQuantity: number
): { isValid: boolean; error?: string } {
  if (sellQuantity <= 0) {
    return { isValid: false, error: 'Sell quantity must be positive' };
  }

  if (sellQuantity > currentQuantity) {
    return { 
      isValid: false, 
      error: `Cannot sell ${sellQuantity} units. Only ${currentQuantity} units available.` 
    };
  }

  return { isValid: true };
}

/**
 * Validate if a buy transaction is possible
 */
export function validateBuyTransaction(
  buyQuantity: number,
  buyPrice: number
): { isValid: boolean; error?: string } {
  if (buyQuantity <= 0) {
    return { isValid: false, error: 'Buy quantity must be positive' };
  }

  if (buyPrice <= 0) {
    return { isValid: false, error: 'Buy price must be positive' };
  }

  return { isValid: true };
}

/**
 * Calculate the impact of a transaction on position metrics
 */
export function calculateTransactionImpact(
  currentQuantity: number,
  currentAverageCost: number,
  transactionType: TransactionType,
  transactionQuantity: number,
  transactionPrice: number
): {
  newQuantity: number;
  newAverageCost: number;
  newTotalInvested: number;
  realizedGainLoss?: number;
} {
  if (transactionType === 'BUY') {
    const newQuantity = currentQuantity + transactionQuantity;
    const currentTotalInvested = currentQuantity * currentAverageCost;
    const transactionValue = transactionQuantity * transactionPrice;
    const newTotalInvested = currentTotalInvested + transactionValue;
    const newAverageCost = newTotalInvested / newQuantity;

    return {
      newQuantity,
      newAverageCost,
      newTotalInvested,
    };
  } else {
    // SELL transaction
    const newQuantity = currentQuantity - transactionQuantity;
    const soldValue = transactionQuantity * transactionPrice;
    const soldCostBasis = transactionQuantity * currentAverageCost;
    const realizedGainLoss = soldValue - soldCostBasis;
    const newTotalInvested = newQuantity * currentAverageCost;

    return {
      newQuantity,
      newAverageCost: currentAverageCost, // Average cost doesn't change on sell
      newTotalInvested,
      realizedGainLoss,
    };
  }
}