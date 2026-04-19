import type { BankProfile } from '@/lib/types';

const TIER_LABELS: Record<string, string> = {
  lt_1B: '< $1B',
  '1B_to_10B': '$1B – $10B',
  '10B_to_50B': '$10B – $50B',
  '50B_to_100B': '$50B – $100B',
  '100B_to_250B': '$100B – $250B',
  '250B_to_700B': '$250B – $700B',
  gt_700B: '> $700B',
  unknown: 'Unknown',
};

const JURISDICTION_LABEL: Record<string, string> = {
  US: 'United States',
  UK: 'United Kingdom',
  EU: 'European Union',
  IN: 'India',
};

export default function ProfileCard({ profile }: { profile: BankProfile }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{profile.legalName}</h2>
          {profile.commonName && profile.commonName !== profile.legalName && (
            <p className="text-sm text-slate-500">also known as {profile.commonName}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {profile.isGSIB && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">G-SIB</span>
          )}
          {profile.isDSIB && !profile.isGSIB && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">D-SIB</span>
          )}
          {profile.isPubliclyListed && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              Publicly listed
            </span>
          )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-slate-500">HQ country</dt>
          <dd className="font-medium text-slate-900">{profile.hqCountry ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Category</dt>
          <dd className="font-medium text-slate-900">{humanize(profile.category)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Total assets</dt>
          <dd className="font-medium text-slate-900">
            {profile.globalAssetsUsdB
              ? `~$${profile.globalAssetsUsdB.toFixed(0)}B`
              : TIER_LABELS[profile.assetSizeTier]}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Size tier</dt>
          <dd className="font-medium text-slate-900">{TIER_LABELS[profile.assetSizeTier]}</dd>
        </div>
      </dl>

      {profile.presence.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-700">Regulated presence</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {profile.presence.map((p) => (
              <li key={p.jurisdiction} className="flex flex-wrap items-baseline gap-2">
                <span className="inline-flex min-w-[4.5rem] justify-center rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                  {JURISDICTION_LABEL[p.jurisdiction] ?? p.jurisdiction}
                </span>
                <span className="text-slate-700">
                  {humanize(p.entityType)}
                  {p.isFBO ? ' (FBO)' : ''}
                  {p.jurisdictionAssetsUsdB ? ` · ~$${p.jurisdictionAssetsUsdB.toFixed(0)}B assets` : ''}
                  {p.notes ? ` — ${p.notes}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {profile.activities.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-700">Business activities</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile.activities.map((a) => (
              <span
                key={a}
                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
              >
                {humanize(a)}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.rationale && (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{profile.rationale}</p>
      )}

      {profile.sources && profile.sources.length > 0 && (
        <div className="mt-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sources</h3>
          <ul className="mt-1 space-y-0.5 text-xs">
            {profile.sources.map((s, i) => (
              <li key={i}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-700 underline decoration-brand-300 underline-offset-2 hover:decoration-brand-600"
                >
                  {s.title ?? s.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function humanize(s: string): string {
  return s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
