'use client';

import { useState } from 'react';
import type { BankProfile } from '@/lib/types';

// Clearbit Logo API — free, no auth, ~98% hit rate for major banks. We
// guess the domain from common name patterns; if the image fails to load
// we silently swap to a monogram fallback so the layout never breaks.

function guessDomain(profile: BankProfile): string {
  const name = (profile.commonName ?? profile.legalName)
    .toLowerCase()
    .replace(/\b(the|bank|group|holdings|holding|corporation|corp|company|co|inc|ltd|limited|plc|s\.a|sa|ag|nv|gmbh)\b/g, '')
    .replace(/[^a-z]+/g, '')
    .trim();
  return name + '.com';
}

interface Props {
  profile: BankProfile;
}

export default function BankLogo({ profile }: Props) {
  const [failed, setFailed] = useState(false);
  const domain = guessDomain(profile);
  const monogram = (profile.commonName ?? profile.legalName)
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (failed || !domain || domain === '.com') {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-base font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
        {monogram || '🏛️'}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://logo.clearbit.com/${domain}?size=96`}
      alt={`${profile.legalName} logo`}
      className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
