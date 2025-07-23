/**
 * Form validation utilities with real-time feedback
 */

import { z } from 'zod';
import { sanitizedSchemas } from './input-sanitization';

// Common validation schemas
export const commonSchemas = {
  email: sanitizedSchemas.email,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string()
    .transform(val => typeof val === 'string' ? val.trim() : val)
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: sanitizedSchemas.description,
  positiveNumber: sanitizedSchemas.positiveNumber,
  nonNegativeNumber: sanitizedSchemas.nonNegativeNumber,
  currency: sanitizedSchemas.nonNegativeNumber.max(999999999, 'Amount is too large'),
  percentage: sanitizedSchemas.nonNegativeNumber.max(100, 'Percentage cannot exceed 100%'),
};

// Portfolio validation schemas
export const portfolioSchemas = {
  name: sanitizedSchemas.portfolioName,
  
  description: sanitizedSchemas.description,
  
  assetType: z.enum(['stocks', 'crypto', 'mixed'], {
    errorMap: () => ({ message: 'Please select a valid asset type' })
  }),
};

// Position validation schemas
export const positionSchemas = {
  symbol: sanitizedSchemas.assetSymbol,
  
  quantity: sanitizedSchemas.positiveNumber
    .max(999999999, 'Quantity is too large'),
  
  averageCost: sanitizedSchemas.positiveNumber
    .max(999999, 'Average cost is too large'),
  
  currentPrice: sanitizedSchemas.nonNegativeNumber
    .max(999999, 'Current price is too large')
    .optional(),
};

// Combined schemas for forms
export const createPortfolioSchema = z.object({
  name: portfolioSchemas.name,
  description: portfolioSchemas.description,
  asset_type: portfolioSchemas.assetType,
});

export const updatePortfolioSchema = z.object({
  name: portfolioSchemas.name.optional(),
  description: portfolioSchemas.description,
});

export const createPositionSchema = z.object({
  symbol: positionSchemas.symbol,
  quantity: positionSchemas.quantity,
  average_cost: positionSchemas.averageCost,
  current_price: positionSchemas.currentPrice,
});

export const updatePositionSchema = z.object({
  symbol: positionSchemas.symbol.optional(),
  quantity: positionSchemas.quantity.optional(),
  average_cost: positionSchemas.averageCost.optional(),
  current_price: positionSchemas.currentPrice,
});

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  data?: any;
}

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
}

// Real-time field validation
export function validateField<T>(
  schema: z.ZodSchema<T>,
  value: any,
  fieldName?: string
): FieldValidationResult {
  try {
    schema.parse(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        isValid: false,
        error: firstError.message,
      };
    }
    return {
      isValid: false,
      error: fieldName ? `Invalid ${fieldName}` : 'Invalid value',
    };
  }
}

// Form validation
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: any
): ValidationResult {
  try {
    const validData = schema.parse(data);
    return {
      isValid: true,
      errors: {},
      data: validData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return {
        isValid: false,
        errors,
      };
    }
    return {
      isValid: false,
      errors: { general: 'Validation failed' },
    };
  }
}

// Custom validation rules
export const customValidators = {
  // Check if portfolio name is unique (to be used with async validation)
  portfolioNameUnique: (name: string, excludeId?: string) => {
    // This will be implemented in the component using the API
    return true;
  },

  // Validate stock symbol format
  stockSymbol: (symbol: string): boolean => {
    return /^[A-Z]{1,5}$/.test(symbol);
  },

  // Validate crypto symbol format
  cryptoSymbol: (symbol: string): boolean => {
    return /^[A-Z]{2,10}$/.test(symbol);
  },

  // Validate currency amount
  currencyAmount: (amount: number): boolean => {
    return amount >= 0 && amount <= 999999999 && Number.isFinite(amount);
  },

  // Validate percentage
  percentage: (value: number): boolean => {
    return value >= 0 && value <= 100 && Number.isFinite(value);
  },
};

// Debounced validation for real-time feedback
export function createDebouncedValidator<T>(
  validator: (value: T) => FieldValidationResult | Promise<FieldValidationResult>,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout;

  return (value: T): Promise<FieldValidationResult> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const result = await validator(value);
        resolve(result);
      }, delay);
    });
  };
}

// Validation error formatting
export function formatValidationErrors(errors: Record<string, string>): string[] {
  return Object.values(errors).filter(Boolean);
}

export function getFirstValidationError(errors: Record<string, string>): string | undefined {
  const errorValues = Object.values(errors).filter(Boolean);
  return errorValues.length > 0 ? errorValues[0] : undefined;
}

// Form field state management
export interface FormFieldState {
  value: any;
  error?: string;
  touched: boolean;
  validating: boolean;
}

export interface FormState {
  fields: Record<string, FormFieldState>;
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
}

export function createInitialFormState(fieldNames: string[]): FormState {
  const fields: Record<string, FormFieldState> = {};
  
  fieldNames.forEach(name => {
    fields[name] = {
      value: '',
      touched: false,
      validating: false,
    };
  });

  return {
    fields,
    isValid: false,
    isSubmitting: false,
    submitCount: 0,
  };
}

// Validation helpers for specific use cases
export const validationHelpers = {
  // Check if all required fields are filled
  hasRequiredFields: (data: Record<string, any>, requiredFields: string[]): boolean => {
    return requiredFields.every(field => {
      const value = data[field];
      return value !== undefined && value !== null && value !== '';
    });
  },

  // Clean and format input values
  cleanInput: (value: string): string => {
    return value.trim().replace(/\s+/g, ' ');
  },

  // Format currency input
  formatCurrency: (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  },

  // Parse currency input
  parseCurrency: (value: string): number => {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  },

  // Format percentage
  formatPercentage: (value: number): string => {
    return `${value.toFixed(2)}%`;
  },

  // Validate file upload
  validateFile: (file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}): FieldValidationResult => {
    const { maxSize = 5 * 1024 * 1024, allowedTypes = [] } = options; // 5MB default

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
      };
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type must be one of: ${allowedTypes.join(', ')}`,
      };
    }

    return { isValid: true };
  },
};