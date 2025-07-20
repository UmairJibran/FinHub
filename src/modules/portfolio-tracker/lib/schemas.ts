/**
 * Zod validation schemas for Portfolio Tracker
 */

import { z } from 'zod';
import { AssetType, TransactionType } from './types';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const AssetTypeSchema = z.nativeEnum(AssetType);
export const TransactionTypeSchema = z.nativeEnum(TransactionType);

// ============================================================================
// CORE ENTITY SCHEMAS
// ============================================================================

/**
 * User schema for profile validation
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

/**
 * Portfolio schema with comprehensive validation
 */
export const PortfolioSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z
    .string()
    .min(1, 'Portfolio name is required')
    .max(100, 'Portfolio name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional(),
  asset_type: AssetTypeSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Position schema with financial validation
 */
export const PositionSchema = z.object({
  id: z.string().uuid(),
  portfolio_id: z.string().uuid(),
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(20, 'Symbol must be less than 20 characters')
    .trim()
    .toUpperCase(),
  name: z
    .string()
    .min(1, 'Asset name is required')
    .max(200, 'Asset name must be less than 200 characters')
    .trim(),
  quantity: z
    .number()
    .positive('Quantity must be positive')
    .finite('Quantity must be a valid number'),
  average_cost: z
    .number()
    .positive('Average cost must be positive')
    .finite('Average cost must be a valid number'),
  total_invested: z
    .number()
    .positive('Total invested must be positive')
    .finite('Total invested must be a valid number')
    .multipleOf(0.01, 'Amount precision too high'),
  current_price: z
    .number()
    .positive('Current price must be positive')
    .finite('Current price must be a valid number')
    .optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Transaction schema for audit trail
 */
export const TransactionSchema = z.object({
  id: z.string().uuid(),
  position_id: z.string().uuid(),
  type: TransactionTypeSchema,
  quantity: z
    .number()
    .positive('Quantity must be positive')
    .finite('Quantity must be a valid number'),
  price: z
    .number()
    .positive('Price must be positive')
    .finite('Price must be a valid number'),
  transaction_date: z.string().datetime(),
  created_at: z.string().datetime(),
});

// ============================================================================
// INPUT SCHEMAS (for forms and API)
// ============================================================================

/**
 * Portfolio creation schema
 */
export const CreatePortfolioSchema = z.object({
  name: z
    .string()
    .min(1, 'Portfolio name is required')
    .max(100, 'Portfolio name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  asset_type: AssetTypeSchema,
});

/**
 * Portfolio update schema
 */
export const UpdatePortfolioSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Portfolio name is required')
      .max(100, 'Portfolio name must be less than 100 characters')
      .trim()
      .optional(),
    description: z
      .string()
      .max(500, 'Description must be less than 500 characters')
      .trim()
      .optional()
      .or(z.literal('')),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/**
 * Position creation schema with purchase price
 */
export const CreatePositionSchema = z.object({
  portfolio_id: z.string().uuid('Invalid portfolio ID'),
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(20, 'Symbol must be less than 20 characters')
    .trim()
    .toUpperCase(),
  name: z
    .string()
    .min(1, 'Asset name is required')
    .max(200, 'Asset name must be less than 200 characters')
    .trim(),
  quantity: z
    .number()
    .positive('Quantity must be positive')
    .finite('Quantity must be a valid number'),
  purchase_price: z
    .number()
    .positive('Purchase price must be positive')
    .finite('Purchase price must be a valid number'),
  current_price: z
    .number()
    .positive('Current price must be positive')
    .finite('Current price must be a valid number')

    .optional(),
});

/**
 * Position update schema
 */
export const UpdatePositionSchema = z
  .object({
    symbol: z
      .string()
      .min(1, 'Symbol is required')
      .max(20, 'Symbol must be less than 20 characters')
      .trim()
      .toUpperCase()
      .optional(),
    name: z
      .string()
      .min(1, 'Asset name is required')
      .max(200, 'Asset name must be less than 200 characters')
      .trim()
      .optional(),
    quantity: z
      .number()
      .positive('Quantity must be positive')
      .finite('Quantity must be a valid number')
      .optional(),
    purchase_price: z
      .number()
      .positive('Purchase price must be positive')
      .finite('Purchase price must be a valid number')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/**
 * Transaction creation schema
 */
export const CreateTransactionSchema = z.object({
  position_id: z.string().uuid('Invalid position ID'),
  type: TransactionTypeSchema,
  quantity: z
    .number()
    .positive('Quantity must be positive')
    .finite('Quantity must be a valid number'),
  price: z
    .number()
    .positive('Price must be positive')
    .finite('Price must be a valid number'),
  transaction_date: z.string().datetime('Invalid transaction date'),
});

// ============================================================================
// FORM SCHEMAS
// ============================================================================

/**
 * Login form validation schema
 */
export const LoginFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be less than 128 characters'),
});

/**
 * Portfolio form validation schema
 */
export const PortfolioFormSchema = CreatePortfolioSchema;

/**
 * Position form validation schema
 */
export const PositionFormSchema = CreatePositionSchema;

/**
 * Transaction form validation schema
 */
export const TransactionFormSchema = CreateTransactionSchema;

// ============================================================================
// QUERY PARAMETER SCHEMAS
// ============================================================================

/**
 * Query parameters schema for API endpoints
 */
export const QueryParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().optional(),
  asset_type: AssetTypeSchema.optional(),
});

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

/**
 * Generic API response schema
 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema.optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.record(z.any()).optional(),
        field: z.string().optional(),
      })
      .optional(),
    success: z.boolean(),
    message: z.string().optional(),
  });

/**
 * Paginated response schema
 */
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      total_pages: z.number().int().nonnegative(),
      has_next: z.boolean(),
      has_prev: z.boolean(),
    }),
  });

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates if a string is a valid UUID
 */
export const isValidUUID = (value: string): boolean => {
  try {
    z.string().uuid().parse(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates if a number is a valid financial amount
 */
export const isValidAmount = (value: number): boolean => {
  try {
    z.number().positive().finite().multipleOf(0.01).parse(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates if a number is a valid quantity
 */
export const isValidQuantity = (value: number): boolean => {
  try {
    z.number().positive().finite().multipleOf(0.00000001).parse(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates if a string is a valid asset symbol
 */
export const isValidSymbol = (value: string): boolean => {
  try {
    z.string().min(1).max(20).trim().parse(value);
    return true;
  } catch {
    return false;
  }
};

// ============================================================================
// TYPE INFERENCE
// ============================================================================

// Infer types from schemas for type safety
export type UserInput = z.infer<typeof UserSchema>;
export type PortfolioInput = z.infer<typeof PortfolioSchema>;
export type CreatePortfolioInput = z.infer<typeof CreatePortfolioSchema>;
export type UpdatePortfolioInput = z.infer<typeof UpdatePortfolioSchema>;
export type PositionInput = z.infer<typeof PositionSchema>;
export type CreatePositionInput = z.infer<typeof CreatePositionSchema>;
export type UpdatePositionInput = z.infer<typeof UpdatePositionSchema>;
export type TransactionInput = z.infer<typeof TransactionSchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type LoginFormInput = z.infer<typeof LoginFormSchema>;
export type PortfolioFormInput = z.infer<typeof PortfolioFormSchema>;
export type PositionFormInput = z.infer<typeof PositionFormSchema>;
export type TransactionFormInput = z.infer<typeof TransactionFormSchema>;
export type QueryParamsInput = z.infer<typeof QueryParamsSchema>;
