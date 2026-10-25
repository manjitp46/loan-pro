import { LoanPreset, SavedCalculationItem } from '../types';

const API_BASE = '/api';

export async function fetchPresets(): Promise<LoanPreset[]> {
  try {
    const res = await fetch(`${API_BASE}/presets`);
    const data = await res.json();
    return data.presets || [];
  } catch (err) {
    console.error('Failed to fetch presets, using fallback', err);
    return [];
  }
}

export async function fetchSettings(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    const data = await res.json();
    return data.settings || {};
  } catch (err) {
    console.error('Failed to fetch site settings', err);
    return {};
  }
}

export async function saveCalculation(payload: {
  title: string;
  calculatorType: string;
  loanType: string;
  inputData: any;
  resultSummary: any;
}): Promise<{ id: string; shareCode: string; shareUrl: string }> {
  const res = await fetch(`${API_BASE}/saved`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to save calculation');
  return data.data;
}

export async function fetchSavedList(): Promise<SavedCalculationItem[]> {
  try {
    const res = await fetch(`${API_BASE}/saved`);
    const data = await res.json();
    return data.calculations || [];
  } catch (err) {
    console.error('Failed to list saved calculations', err);
    return [];
  }
}

export async function fetchSavedByCode(code: string): Promise<any> {
  const res = await fetch(`${API_BASE}/saved/${code}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Not found');
  return data.data;
}

export async function deleteSaved(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/saved/${id}`, { method: 'DELETE' });
  const data = await res.json();
  return !!data.success;
}
