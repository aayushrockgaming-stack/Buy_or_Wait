// Currency exchange rates relative to USD base
export const FX_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 1.09,    // 1 EUR = 1.09 USD
  GBP: 1.28,    // 1 GBP = 1.28 USD
  INR: 0.012,   // 1 INR = 0.012 USD (approx 1 USD = 83.33 INR)
  ZAR: 0.054,   // 1 ZAR = 0.054 USD (approx 1 USD = 18.5 ZAR)
  IDR: 0.000063 // 1 IDR = 0.000063 USD (approx 1 USD = 15833 IDR)
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  ZAR: 'R',
  IDR: 'Rp',
  JPY: '¥',
  CAD: 'CA$'
};

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;
  const fromRate = FX_RATES_TO_USD[fromCurrency] || 1.0;
  const toRate = FX_RATES_TO_USD[toCurrency] || 1.0;
  
  // Convert from origin to USD, then from USD to target
  const amountInUSD = amount * fromRate;
  const amountInTarget = amountInUSD / toRate;
  
  return Math.round(amountInTarget * 100) / 100;
}

export function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  if (currency === 'IDR' || currency === 'INR') {
    return `${symbol} ${Math.round(amount).toLocaleString()}`;
  }
  return `${symbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
