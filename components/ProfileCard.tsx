import type { BankProfile, Jurisdiction } from '@/lib/types';
import Flag from './ui/Flag';
import KpiTile from './ui/KpiTile';

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

const JURISDICTION_LABEL: Record<Jurisdiction, string> = {
  US: 'United States',
  UK: 'United Kingdom',
  EU: 'European Union',
  IN: 'India',
};

function humanize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAssets(profile: BankProfile): string {
  if (profile.globalAssetsUsdB) {
    if (profile.globalAssetsUsdB >= 1000) return `$${(profile.globalAssetsUsdB / 1000).toFixed(2)}T`;
    return `$${profile.globalAssetsUsdB.toFixed(0)}B`;
  }
  return TIER_LABELS[profile.assetSizeTier] ?? '—';
}

export default function ProfileCard({ profile }: { profile: BankProfile }) {
  const designations: string[] = [];
  if (profile.isGSIB) designations.push('G-SIB');
  if (profile.isDSIB) designations.push('D-SIB');
  if (profile.isPubliclyListed) designations.push('Listed');
  if (profile.isFDICInsured) designations.push('FDIC');

  const jurisdictions = profile.presence.map((p) => p.jurisdiction);

  return (
    <section
      id="profile"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 print-card"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {profile.legalName}
          </h2>
          {profile.commonName && profile.commonName !== profile.legalName && (
            <p className="text-sm text-slate-500 dark:text-slate-400">also known as {profile.commonName}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{humanize(profile.category)}</span>
            {profile.hqCountry && (
              <>
                <span aria-hidden>·</span>
                <span>HQ {profile.hqCountry}</span>
              </>
            )}
          </div>
        </div>
        {designations.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {profile.isGSIB && <Badge tone="red">G-SIB</Badge>}
            {profile.isDSIB && !profile.isGSIB && <Badge tone="orange">D-SIB</Badge>}
            {profile.isPubliclyListed && <Badge tone="emerald">Listed</Badge>}
            {profile.isFDICInsured && <Badge tone="blue">FDIC</Badge>}
          </div>
        )}
      </header>

      {/* KPI Strip */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiTile
          label="Total assets"
          value={formatAssets(profile)}
          detail={profile.globalAssetsUsdB ? TIER_LABELS[profile.assetSizeTier] : 'estimated tier'}
        />
        <KpiTile
          label="Asset tier"
          value={TIER_LABELS[profile.assetSizeTier] ?? '—'}
          accent="brand"
        />
        <KpiTile
          label="Jurisdictions"
          value={
            <span className="flex flex-wrap items-center gap-1">
              {jurisdictions.length === 0 ? (
                '—'
              ) : (
                jurisdictions.map((j) => (
                  <Flag key={j} jurisdiction={j} size="md" />
                ))
              )}
            </span>
          }
          detail={`${jurisdictions.length} active`}
        />
        <KpiTile
          label="Designations"
          value={designations.length > 0 ? designations.join(' · ') : 'None'}
          accent={profile.isGSIB ? 'red' : profile.isDSIB ? 'amber' : 'default'}
        />
      </div>

      {profile.presence.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Regulated presence
          </h3>
          <ul className="mt-2 space-y-2 text-sm">
            {profile.presence.map((p) => (
              <li
                key={p.jurisdiction}
                className="flex flex-wrap items-baseline gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <Flag jurisdiction={p.jurisdiction} size="lg" />
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {JURISDICTION_LABEL[p.jurisdiction]}
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {humanize(p.entityType)}
                  {p.isFBO ? ' (FBO)' : ''}
                  {p.jurisdictionAssetsUsdB ? ` · ~$${p.jurisdictionAssetsUsdB.toFixed(0)}B` : ''}
                </span>
                {p.notes && (
                  <span className="block w-full text-xs text-slate-500 dark:text-slate-400">
                    {p.notes}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {profile.activities.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Business activities
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile.activities.map((a) => (
              <span
                key={a}
                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {humanize(a)}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.rationale && (
        <details className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800/40 dark:text-slate-200" open>
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Research rationale
          </summary>
          <p className="mt-2 whitespace-pre-wrap">{profile.rationale}</p>
        </details>
      )}

      {profile.sources && profile.sources.length > 0 && (
        <div className="mt-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Sources
          </h3>
          <ul className="mt-1 space-y-0.5 text-xs">
            {profile.sources.map((s, i) => (
              <li key={i}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-700 underline decoration-brand-300 underline-offset-2 hover:decoration-brand-600 dark:text-brand-400"
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

function Badge({ tone, children }: { tone: 'red' | 'orange' | 'emerald' | 'blue'; children: React.ReactNode }) {
  const cls = {
    red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
  }[tone];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{children}</span>
  );
}
