/**
 * Input sanitization and validation utilities for security
 */

import { z } from 'zod';

// HTML sanitization utility
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove HTML tags and potentially dangerous characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim();
}

// SQL injection prevention
export function sanitizeSqlInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove potentially dangerous SQL characters and keywords
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comment start
    .replace(/\*\//g, '') // Remove block comment end
    .replace(/\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE|EXEC|EXECUTE)\b/gi, '') // Remove SQL keywords
    .trim();
}

// XSS prevention for user input
export function sanitizeUserInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return sanitizeHtml(input)
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/[{}]/g, '') // Remove curly braces
    .replace(/\$\{/g, '') // Remove template literal syntax
    .replace(/eval\(/gi, '') // Remove eval calls
    .replace(/Function\(/gi, '') // Remove Function constructor
    .trim();
}

// Sanitize numeric input
export function sanitizeNumericInput(input: any): number | null {
  if (typeof input === 'number') {
    if (isNaN(input) || !isFinite(input)) return null;
    return input;
  }
  
  if (typeof input === 'string') {
    // Remove non-numeric characters except decimal point and minus sign
    const cleaned = input.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    
    if (isNaN(parsed) || !isFinite(parsed)) return null;
    return parsed;
  }
  
  return null;
}

// Sanitize portfolio/position names
export function sanitizeAssetName(input: string): string {
  if (typeof input !== 'string') return '';
  
  return sanitizeUserInput(input)
    .replace(/[^a-zA-Z0-9\s\-_.]/g, '') // Only allow alphanumeric, spaces, hyphens, underscores, dots
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 100); // Limit length
}

// Sanitize asset symbols (stocks, crypto, etc.)
export function sanitizeAssetSymbol(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // Only allow uppercase letters and numbers
    .trim()
    .substring(0, 10); // Limit length
}

// Sanitize email addresses
export function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, '') // Only allow valid email characters
    .trim()
    .substring(0, 254); // RFC 5321 limit
}

// Sanitize URLs
export function sanitizeUrl(input: string): string {
  if (typeof input !== 'string') return '';
  
  try {
    const url = new URL(input);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return '';
    }
    return url.toString();
  } catch {
    return '';
  }
}

// Rate limiting utility
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }

  reset(identifier?: string): void {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }
}

// Global rate limiter instances
export const apiRateLimiter = new RateLimiter(60, 60000); // 60 requests per minute
export const authRateLimiter = new RateLimiter(5, 300000); // 5 auth attempts per 5 minutes

// Validation schemas with sanitization
export const sanitizedSchemas = {
  portfolioName: z.string()
    .transform(sanitizeAssetName)
    .refine(val => val.length > 0, 'Portfolio name is required')
    .refine(val => val.length <= 50, 'Portfolio name must be less than 50 characters'),
    
  assetSymbol: z.string()
    .transform(sanitizeAssetSymbol)
    .refine(val => val.length > 0, 'Asset symbol is required')
    .refine(val => val.length <= 10, 'Asset symbol must be less than 10 characters')
    .refine(val => /^[A-Z0-9]+$/.test(val), 'Asset symbol must contain only uppercase letters and numbers'),
    
  description: z.string()
    .transform(sanitizeUserInput)
    .refine(val => val.length <= 500, 'Description must be less than 500 characters')
    .optional(),
    
  email: z.string()
    .email('Please enter a valid email address')
    .transform(sanitizeEmail),
    
  positiveNumber: z.number()
    .or(z.string().transform(val => sanitizeNumericInput(val)))
    .refine(val => val !== null && val > 0, 'Must be a positive number')
    .transform(val => val as number),
    
  nonNegativeNumber: z.number()
    .or(z.string().transform(val => sanitizeNumericInput(val)))
    .refine(val => val !== null && val >= 0, 'Must be zero or positive')
    .transform(val => val as number),
};

// Security headers utility
export function getSecurityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co;",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

// Input validation middleware
export function validateAndSanitizeInput<T>(
  schema: z.ZodSchema<T>,
  input: any
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { success: false, error: firstError.message };
    }
    return { success: false, error: 'Invalid input' };
  }
}

// Secure random string generator
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Use crypto.getRandomValues if available, fallback to Math.random
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) score += 1;
  else feedback.push('Password must be at least 8 characters long');
  
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Password must contain lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Password must contain uppercase letters');
  
  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Password must contain numbers');
  
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Password must contain special characters');
  
  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeating characters');
  }
  
  if (/123|abc|qwe/i.test(password)) {
    score -= 1;
    feedback.push('Avoid common sequences');
  }
  
  return {
    isValid: score >= 4,
    score: Math.max(0, score),
    feedback,
  };
}

// Environment variable validation
export function validateEnvironmentVariables(): boolean {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate Supabase URL format
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    throw new Error('Invalid Supabase URL format');
  }
  
  return true;
}