import { CurrencyType, LoanType } from '../types';

export interface LoanAppState {
  tab?: string;
  type?: LoanType;
  currency?: CurrencyType;
  amount?: number;
  rate?: number;
  tenure?: number;
  tenureUnit?: 'years' | 'months';
  downPaymentPercent?: number;
  // Multi-rate planner specific params
  rates?: number[];
  tenures?: number[];
  baseRate?: number;
  baseTenure?: number;
  // Additional calculator params
  extraMonthly?: number;
  currentRate?: number;
  newRate?: number;
  income?: number;
}

const STORAGE_KEY = 'loanpro_session_v2';

/**
 * Parses URL search parameters with fallback to localStorage
 */
export function getInitialAppState(): LoanAppState {
  try {
    const params = new URLSearchParams(window.location.search);
    const hasParams = Array.from(params.keys()).length > 0;

    if (hasParams) {
      const state: LoanAppState = {};

      const tab = params.get('tab');
      if (tab) state.tab = tab;

      const type = params.get('type') as LoanType;
      if (type) state.type = type;

      const curr = params.get('curr') as CurrencyType;
      if (curr) state.currency = curr;

      const amount = params.get('amount');
      if (amount && !isNaN(Number(amount))) state.amount = Number(amount);

      const rate = params.get('rate');
      if (rate && !isNaN(Number(rate))) state.rate = Number(rate);

      const tenure = params.get('tenure');
      if (tenure && !isNaN(Number(tenure))) state.tenure = Number(tenure);

      const unit = params.get('unit');
      if (unit === 'years' || unit === 'months') state.tenureUnit = unit;

      const dp = params.get('dp');
      if (dp && !isNaN(Number(dp))) state.downPaymentPercent = Number(dp);

      const ratesStr = params.get('rates');
      if (ratesStr) {
        state.rates = ratesStr.split(',').map(Number).filter((n) => !isNaN(n) && n > 0);
      }

      const tenuresStr = params.get('tenures');
      if (tenuresStr) {
        state.tenures = tenuresStr.split(',').map(Number).filter((n) => !isNaN(n) && n > 0);
      }

      const baseRate = params.get('baseRate');
      if (baseRate && !isNaN(Number(baseRate))) state.baseRate = Number(baseRate);

      const baseTenure = params.get('baseTenure');
      if (baseTenure && !isNaN(Number(baseTenure))) state.baseTenure = Number(baseTenure);

      return state;
    }

    // Fallback to localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to parse URL/storage state:', err);
  }

  return {};
}

/**
 * Synchronizes current app parameters into URL query string and local storage
 */
export function syncAppState(updates: LoanAppState): void {
  try {
    const current = getInitialAppState();
    const merged = { ...current, ...updates };

    // Clean undefined or null fields
    Object.keys(merged).forEach((k) => {
      if ((merged as any)[k] === undefined || (merged as any)[k] === null) {
        delete (merged as any)[k];
      }
    });

    // Save to local storage for persistent reload
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

    // Build URL search params
    const searchParams = new URLSearchParams();

    if (merged.tab) searchParams.set('tab', merged.tab);
    if (merged.type) searchParams.set('type', merged.type);
    if (merged.currency) searchParams.set('curr', merged.currency);
    if (merged.amount) searchParams.set('amount', String(merged.amount));
    if (merged.rate) searchParams.set('rate', String(merged.rate));
    if (merged.tenure) searchParams.set('tenure', String(merged.tenure));
    if (merged.tenureUnit) searchParams.set('unit', merged.tenureUnit);
    if (merged.downPaymentPercent !== undefined) searchParams.set('dp', String(merged.downPaymentPercent));
    if (merged.rates && merged.rates.length > 0) searchParams.set('rates', merged.rates.join(','));
    if (merged.tenures && merged.tenures.length > 0) searchParams.set('tenures', merged.tenures.join(','));
    if (merged.baseRate) searchParams.set('baseRate', String(merged.baseRate));
    if (merged.baseTenure) searchParams.set('baseTenure', String(merged.baseTenure));

    const newQuery = searchParams.toString();
    const newRelativePathQuery = window.location.pathname + (newQuery ? `?${newQuery}` : '');
    window.history.replaceState(null, '', newRelativePathQuery);
  } catch (err) {
    console.error('Failed to sync app state:', err);
  }
}

/**
 * Generates an absolute shareable URL for the given state
 */
export function generateShareUrl(state: LoanAppState): string {
  const searchParams = new URLSearchParams();
  if (state.tab) searchParams.set('tab', state.tab);
  if (state.type) searchParams.set('type', state.type);
  if (state.currency) searchParams.set('curr', state.currency);
  if (state.amount) searchParams.set('amount', String(state.amount));
  if (state.rate) searchParams.set('rate', String(state.rate));
  if (state.tenure) searchParams.set('tenure', String(state.tenure));
  if (state.tenureUnit) searchParams.set('unit', state.tenureUnit);
  if (state.downPaymentPercent !== undefined) searchParams.set('dp', String(state.downPaymentPercent));
  if (state.rates && state.rates.length > 0) searchParams.set('rates', state.rates.join(','));
  if (state.tenures && state.tenures.length > 0) searchParams.set('tenures', state.tenures.join(','));
  if (state.baseRate) searchParams.set('baseRate', String(state.baseRate));
  if (state.baseTenure) searchParams.set('baseTenure', String(state.baseTenure));

  const query = searchParams.toString();
  return `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ''}`;
}

/**
 * Copies text to clipboard and returns success boolean
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Clipboard copy error:', err);
    return false;
  }
}
