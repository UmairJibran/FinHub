// Currency configuration and utilities
import { useAuthStore } from './auth/authStore';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'en-EU' },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', locale: 'ur-PK' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', locale: 'en-CA' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', locale: 'de-CH' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', locale: 'zh-CN' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', locale: 'ko-KR' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', locale: 'en-HK' },
];

export const DEFAULT_CURRENCY = 'USD';

/**
 * Get currency configuration by currency code
 */
export function getCurrencyByCode(code: string): Currency | undefined {
  return SUPPORTED_CURRENCIES.find((currency) => currency.code === code);
}

/**
 * Get the user's preferred currency from the auth store
 * Falls back to DEFAULT_CURRENCY if not available
 */
export function getUserPreferredCurrency(): string {
  try {
    const { profile } = useAuthStore.getState();
    const preferredCurrency = profile?.preferred_currency;
    
    // Validate that the preferred currency is supported
    if (preferredCurrency && getCurrencyByCode(preferredCurrency)) {
      return preferredCurrency;
    }
    
    // Log warning if preferred currency is not supported
    if (preferredCurrency && !getCurrencyByCode(preferredCurrency)) {
      console.warn(`Unsupported preferred currency: ${preferredCurrency}. Falling back to ${DEFAULT_CURRENCY}`);
    }
    
    return DEFAULT_CURRENCY;
  } catch (error) {
    console.error('Error getting user preferred currency:', error);
    return DEFAULT_CURRENCY;
  }
}

/**
 * Format currency amount using the user's preferred currency
 * Falls back to provided currencyCode or DEFAULT_CURRENCY
 * 
 * @param amount - The amount to format
 * @param options - Either a string (currency code) or an object with currency and locale options
 * @param numberFormatOptions - Additional Intl.NumberFormat options
 */
export function formatCurrency(
  amount: number,
  options?: string | { currency?: string; locale?: string },
  numberFormatOptions: Intl.NumberFormatOptions = {}
): string {
  try {
    let targetCurrency: string;
    let locale: string;

    // Handle different parameter formats
    if (typeof options === 'string') {
      // Legacy format: formatCurrency(amount, 'USD')
      targetCurrency = options;
      const currency = getCurrencyByCode(targetCurrency);
      locale = currency?.locale || 'en-US';
    } else if (options && typeof options === 'object') {
      // New format: formatCurrency(amount, { currency: 'USD', locale: 'en-US' })
      targetCurrency = options.currency || getUserPreferredCurrency();
      const currency = getCurrencyByCode(targetCurrency);
      locale = options.locale || currency?.locale || 'en-US';
    } else {
      // No options: formatCurrency(amount) - use user preference
      targetCurrency = getUserPreferredCurrency();
      const currency = getCurrencyByCode(targetCurrency);
      locale = currency?.locale || 'en-US';
    }

    const currency = getCurrencyByCode(targetCurrency);

    if (!currency) {
      // Fallback to USD if currency not found
      console.warn(`Currency not found: ${targetCurrency}. Falling back to ${DEFAULT_CURRENCY}`);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: DEFAULT_CURRENCY,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...numberFormatOptions,
      }).format(amount);
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...numberFormatOptions,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    // Ultimate fallback
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: DEFAULT_CURRENCY,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...numberFormatOptions,
    }).format(amount);
  }
}

/**
 * Format currency amount with explicit currency code (bypasses user preference)
 */
export function formatCurrencyExplicit(
  amount: number,
  currencyCode: string,
  options: Intl.NumberFormatOptions = {}
): string {
  try {
    const currency = getCurrencyByCode(currencyCode);

    if (!currency) {
      console.warn(`Currency not found: ${currencyCode}. Falling back to ${DEFAULT_CURRENCY}`);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: DEFAULT_CURRENCY,
        ...options,
      }).format(amount);
    }

    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      ...options,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency explicitly:', error);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: DEFAULT_CURRENCY,
      ...options,
    }).format(amount);
  }
}

/**
 * Get currency symbol for the user's preferred currency
 * Falls back to provided currencyCode or DEFAULT_CURRENCY
 */
export function getCurrencySymbol(currencyCode?: string): string {
  try {
    const targetCurrency = currencyCode || getUserPreferredCurrency();
    const currency = getCurrencyByCode(targetCurrency);
    return currency?.symbol || '$';
  } catch (error) {
    console.error('Error getting currency symbol:', error);
    return '$';
  }
}

/**
 * Get currency name for the user's preferred currency
 * Falls back to provided currencyCode or DEFAULT_CURRENCY
 */
export function getCurrencyName(currencyCode?: string): string {
  try {
    const targetCurrency = currencyCode || getUserPreferredCurrency();
    const currency = getCurrencyByCode(targetCurrency);
    return currency?.name || 'US Dollar';
  } catch (error) {
    console.error('Error getting currency name:', error);
    return 'US Dollar';
  }
}

/**
 * Validate if a currency code is supported
 */
export function isSupportedCurrency(currencyCode: string): boolean {
  return !!getCurrencyByCode(currencyCode);
}

/**
 * Get all supported currency codes
 */
export function getSupportedCurrencyCodes(): string[] {
  return SUPPORTED_CURRENCIES.map(currency => currency.code);
}