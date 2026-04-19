'use client';

import { useState } from 'react';
import type {
  Activity,
  AssetSizeTier,
  BankCategory,
  BankProfile,
  Jurisdiction,
  JurisdictionPresence,
} from '@/lib/types';

const CATEGORIES: BankCategory[] = [
  'commercial_bank',
  'investment_bank',
  'savings_bank',
  'credit_union',
  'cooperative_bank',
  'foreign_branch',
  'bank_holding_company',
  'small_finance_bank',
  'payments_bank',
  'nbfc',
  'building_society',
  'other',
];

const TIERS: { value: AssetSizeTier; label: string }[] = [
  { value: 'lt_1B', label: '< $1B' },
  { value: '1B_to_10B', label: '$1B – $10B' },
  { value: '10B_to_50B', label: '$10B – $50B' },
  { value: '50B_to_100B', label: '$50B – $100B' },
  { value: '100B_to_250B', label: '$100B – $250B' },
  { value: '250B_to_700B', label: '$250B – $700B' },
  { value: 'gt_700B', label: '> $700B' },
  { value: 'unknown', label: 'Unknown' },
];

const JURISDICTIONS: Jurisdiction[] = ['US', 'UK', 'EU', 'IN'];

const ACTIVITIES: Activity[] = [
  'retail_deposits',
  'commercial_lending',
  'mortgage_lending',
  'credit_cards',
  'derivatives_trading',
  'securities_underwriting',
  'broker_dealer',
  'asset_management',
  'custody_services',
  'cross_border_payments',
  'foreign_exchange',
  'trade_finance',
  'crypto_assets',
  'priority_sector_lending',
  'agriculture_lending',
];

function humanize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props {
  profile: BankProfile;
  onSave: (next: BankProfile) => void;
  onCancel: () => void;
}

export default function EditableProfileForm({ profile, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<BankProfile>(() => structuredClone(profile));

  function update<K extends keyof BankProfile>(key: K, value: BankProfile[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function toggleActivity(a: Activity) {
    setDraft((d) => ({
      ...d,
      activities: d.activities.includes(a) ? d.activities.filter((x) => x !== a) : [...d.activities, a],
    }));
  }

  function updatePresence(index: number, patch: Partial<JurisdictionPresence>) {
    setDraft((d) => ({
      ...d,
      presence: d.presence.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  }

  function addPresence() {
    const used = new Set(draft.presence.map((p) => p.jurisdiction));
    const next = JURISDICTIONS.find((j) => !used.has(j));
    if (!next) return;
    setDraft((d) => ({
      ...d,
      presence: [...d.presence, { jurisdiction: next, entityType: 'commercial_bank' }],
    }));
  }

  function removePresence(index: number) {
    setDraft((d) => ({ ...d, presence: d.presence.filter((_, i) => i !== index) }));
  }

  return (
    <section className="rounded-2xl border border-brand-300 bg-brand-50/40 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Edit profile</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Apply &amp; recompute
          </button>
        </div>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        Changes run locally against the rules engine — no extra API calls.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="block font-medium text-slate-700">HQ country (ISO-2)</span>
          <input
            type="text"
            maxLength={2}
            value={draft.hqCountry ?? ''}
            onChange={(e) => update('hqCountry', e.target.value.toUpperCase())}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm uppercase"
          />
        </label>
        <label className="text-sm">
          <span className="block font-medium text-slate-700">Category</span>
          <select
            value={draft.category}
            onChange={(e) => update('category', e.target.value as BankCategory)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {humanize(c)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-medium text-slate-700">Asset size tier</span>
          <select
            value={draft.assetSizeTier}
            onChange={(e) => update('assetSizeTier', e.target.value as AssetSizeTier)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {TIERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-medium text-slate-700">Global assets (USD B)</span>
          <input
            type="number"
            min={0}
            step={1}
            value={draft.globalAssetsUsdB ?? ''}
            onChange={(e) =>
              update('globalAssetsUsdB', e.target.value === '' ? undefined : Number(e.target.value))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>

      <fieldset className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Designations
        </legend>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          {(
            [
              ['isGSIB', 'G-SIB'],
              ['isDSIB', 'D-SIB'],
              ['isPubliclyListed', 'Publicly listed'],
              ['isFDICInsured', 'FDIC insured'],
              ['hasInsuranceSubsidiary', 'Insurance subsidiary'],
              ['hasBrokerDealerSubsidiary', 'Broker-dealer subsidiary'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!draft[key]}
                onChange={(e) => update(key, e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Regulated presence
        </legend>
        <div className="space-y-2">
          {draft.presence.map((p, i) => (
            <div
              key={i}
              className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[8rem_1fr_1fr_auto_auto]"
            >
              <select
                value={p.jurisdiction}
                onChange={(e) => updatePresence(i, { jurisdiction: e.target.value as Jurisdiction })}
                className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
              >
                {JURISDICTIONS.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
              <select
                value={p.entityType}
                onChange={(e) => updatePresence(i, { entityType: e.target.value as BankCategory })}
                className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {humanize(c)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                step={1}
                placeholder="Assets (USD B)"
                value={p.jurisdictionAssetsUsdB ?? ''}
                onChange={(e) =>
                  updatePresence(i, {
                    jurisdictionAssetsUsdB: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
              />
              <label className="flex items-center gap-1 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={!!p.isFBO}
                  onChange={(e) => updatePresence(i, { isFBO: e.target.checked })}
                />
                FBO
              </label>
              <button
                type="button"
                onClick={() => removePresence(i)}
                className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Remove
              </button>
            </div>
          ))}
          {draft.presence.length < JURISDICTIONS.length && (
            <button
              type="button"
              onClick={addPresence}
              className="rounded border border-dashed border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              + Add jurisdiction
            </button>
          )}
        </div>
      </fieldset>

      <fieldset className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Activities
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITIES.map((a) => {
            const on = draft.activities.includes(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleActivity(a)}
                className={`rounded-full border px-2.5 py-0.5 text-xs ${
                  on
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {humanize(a)}
              </button>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}
