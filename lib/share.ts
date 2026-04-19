// URL-fragment sharing for analysis state. Encodes bankName + optional
// editedProfile + filters so a recipient can reload the exact same view
// without hitting the server. Stores in the fragment (#share=...) so the
// payload never hits referrer logs.

import type { BankProfile } from './types';

export interface SharePayload {
  bankName: string;
  editedProfile?: BankProfile;
}

function base64UrlEncode(s: string): string {
  const b64 = typeof window !== 'undefined'
    ? window.btoa(unescape(encodeURIComponent(s)))
    : Buffer.from(s, 'utf-8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const raw = typeof window !== 'undefined'
    ? window.atob(b64)
    : Buffer.from(b64, 'base64').toString('binary');
  try {
    return decodeURIComponent(escape(raw));
  } catch {
    return raw;
  }
}

export function encodeShare(payload: SharePayload): string {
  return base64UrlEncode(JSON.stringify(payload));
}

export function decodeShare(encoded: string): SharePayload | null {
  try {
    const raw = base64UrlDecode(encoded);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.bankName !== 'string') {
      return null;
    }
    return parsed as SharePayload;
  } catch {
    return null;
  }
}

export function buildShareUrl(payload: SharePayload): string {
  if (typeof window === 'undefined') return '';
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#share=${encodeShare(payload)}`;
}

export function readShareFromLocation(): SharePayload | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#/, '');
  const params = new URLSearchParams(hash);
  const encoded = params.get('share');
  if (!encoded) return null;
  return decodeShare(encoded);
}
