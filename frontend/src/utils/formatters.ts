import { CurrencyType } from '../types';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  flag: string;
  compactLakhCrore?: boolean;
}

export const CURRENCY_CATALOG: Record<string, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', flag: '🇮🇳', compactLakhCrore: true },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', flag: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', flag: '🇬🇧' },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'en-AE', flag: '🇦🇪' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', locale: 'en-CA', flag: '🇨🇦' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', flag: '🇦🇺' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', flag: '🇸🇬' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', flag: '🇯🇵' },
};

export function getCurrencyConfig(currency: CurrencyType = 'INR'): CurrencyConfig {
  return CURRENCY_CATALOG[currency] || {
    code: currency,
    symbol: currency,
    name: currency,
    locale: 'en-US',
    flag: '🌐',
  };
}

export function getCurrencySymbol(currency: CurrencyType = 'INR'): string {
  return getCurrencyConfig(currency).symbol;
}

export function formatCurrency(amount: number, currency: CurrencyType = 'INR', compact: boolean = false): string {
  const cfg = getCurrencyConfig(currency);
  if (isNaN(amount)) return `${cfg.symbol}0`;

  if (compact) {
    if (cfg.compactLakhCrore) {
      if (Math.abs(amount) >= 10000000) {
        return `${cfg.symbol}${(amount / 10000000).toFixed(2)} Cr`;
      }
      if (Math.abs(amount) >= 100000) {
        return `${cfg.symbol}${(amount / 100000).toFixed(2)} L`;
      }
      if (Math.abs(amount) >= 1000) {
        return `${cfg.symbol}${(amount / 1000).toFixed(1)} K`;
      }
      return `${cfg.symbol}${amount.toLocaleString(cfg.locale)}`;
    } else {
      if (Math.abs(amount) >= 1000000000) {
        return `${cfg.symbol}${(amount / 1000000000).toFixed(2)}B`;
      }
      if (Math.abs(amount) >= 1000000) {
        return `${cfg.symbol}${(amount / 1000000).toFixed(2)}M`;
      }
      if (Math.abs(amount) >= 1000) {
        return `${cfg.symbol}${(amount / 1000).toFixed(1)}K`;
      }
      return `${cfg.symbol}${amount.toLocaleString(cfg.locale)}`;
    }
  }

  return `${cfg.symbol}${Math.round(amount).toLocaleString(cfg.locale)}`;
}

export function formatPercent(val: number, decimals: number = 2): string {
  if (isNaN(val)) return '0%';
  return `${val.toFixed(decimals)}%`;
}

export function formatTenure(months: number): string {
  const yrs = Math.floor(months / 12);
  const remMonths = months % 12;

  if (yrs === 0) return `${remMonths} mo${remMonths > 1 ? 's' : ''}`;
  if (remMonths === 0) return `${yrs} yr${yrs > 1 ? 's' : ''}`;
  return `${yrs} yr${yrs > 1 ? 's' : ''} ${remMonths} mo${remMonths > 1 ? 's' : ''}`;
}
