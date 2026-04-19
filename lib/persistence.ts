// Client-only localStorage persistence for the most recent analysis. Lets
// the user refresh the tab or come back later without losing their work.

import type { AnalysisResult, BankProfile } from './types';

const KEY = 'capgenie:last-analysis:v1';

export interface PersistedAnalysis {
  bankName: string;
  apiResult?: AnalysisResult;
  editedProfile?: BankProfile;
  savedAtIso: string;
}

export function savePersistedAnalysis(value: PersistedAnalysis): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Quota, private mode, etc. — silent failure is fine.
  }
}

export function loadPersistedAnalysis(): PersistedAnalysis | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAnalysis;
    if (!parsed || typeof parsed.bankName !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPersistedAnalysis(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
