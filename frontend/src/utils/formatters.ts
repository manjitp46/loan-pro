import { CurrencyType } from '../types';

export function formatCurrency(amount: number, currency: CurrencyType = 'INR', compact: boolean = false): string {
  if (isNaN(amount)) return currency === 'INR' ? '₹0' : '$0';

  if (compact) {
    if (currency === 'INR') {
      if (Math.abs(amount) >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)} Cr`;
      }
      if (Math.abs(amount) >= 100000) {
        return `₹${(amount / 100000).toFixed(2)} L`;
      }
      if (Math.abs(amount) >= 1000) {
        return `₹${(amount / 1000).toFixed(1)} K`;
      }
      return `₹${amount.toLocaleString('en-IN')}`;
    } else {
      if (Math.abs(amount) >= 1000000) {
        return `$${(amount / 1000000).toFixed(2)}M`;
      }
      if (Math.abs(amount) >= 1000) {
        return `$${(amount / 1000).toFixed(1)}K`;
      }
      return `$${amount.toLocaleString('en-US')}`;
    }
  }

  if (currency === 'INR') {
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  } else {
    return `$${Math.round(amount).toLocaleString('en-US')}`;
  }
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
