type NumberSystem = 'western' | 'southAsian';

interface CurrencyConfig {
    symbol: string;
    name: string;
    numberSystem: NumberSystem;
}

export const CURRENCY_CONFIG: Record<string, CurrencyConfig> = {
    PKR: {
        symbol: '₨',
        name: 'Pakistani Rupee',
        numberSystem: 'southAsian'
    },
    INR: {
        symbol: '₹',
        name: 'Indian Rupee',
        numberSystem: 'southAsian'
    },
    USD: {
        symbol: '$',
        name: 'US Dollar',
        numberSystem: 'western'
    },
    EUR: {
        symbol: '€',
        name: 'Euro',
        numberSystem: 'western'
    },
    GBP: {
        symbol: '£',
        name: 'British Pound',
        numberSystem: 'western'
    }
};

export function formatNumber(value: number, currency: string): string {
    const config = CURRENCY_CONFIG[currency];
    if (!config) return value.toLocaleString();

    if (config.numberSystem === 'southAsian') {
        if (value >= 10000000) { // 1 Crore
            return `${(value / 10000000).toFixed(2)} Cr`;
        } else if (value >= 100000) { // 1 Lac
            return `${(value / 100000).toFixed(2)} Lac`;
        } else if (value >= 1000) {
            return value.toLocaleString('en-IN');
        }
    }

    // Western number system
    if (value >= 1000000000) { // 1 Billion
        return `${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) { // 1 Million
        return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
        return value.toLocaleString('en-US');
    }

    return value.toString();
}

export function formatCurrency(value: number | string, currency: string): string {
    if (typeof value === 'string') {
        value = value.replace(/[^0-9.-]+/g, "");
        value = parseFloat(value);
    }
    const config = CURRENCY_CONFIG[currency];
    if (!config) return `${currency} ${value.toLocaleString()}`;

    const formattedNumber = formatNumber(value, currency);
    return `${formattedNumber}`;
} 