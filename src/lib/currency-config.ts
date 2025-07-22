// Currency configuration and utilities

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

export function getCurrencyByCode(code: string): Currency | undefined {
  return SUPPORTED_CURRENCIES.find((currency) => currency.code === code);
}

export function formatCurrency(
  amount: number,
  currencyCode: string = DEFAULT_CURRENCY,
  options: Intl.NumberFormatOptions = {}
): string {
  const currency = getCurrencyByCode(currencyCode);

  if (!currency) {
    // Fallback to USD if currency not found
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
}

export function getCurrencySymbol(currencyCode: string): string {
  const currency = getCurrencyByCode(currencyCode);
  return currency?.symbol || '$';
}

export function getCurrencyName(currencyCode: string): string {
  const currency = getCurrencyByCode(currencyCode);
  return currency?.name || 'US Dollar';
}