// Rules engine: deterministic mapping from a structured BankProfile to a
// list of applicable ReportRecommendations across US, UK, EU, and India.
//
// Each rule is a small function that returns either a recommendation
// (with a human-readable applicability reason) or null when the report
// does not apply to this bank. This keeps the logic auditable and easy
// to extend.

import { REPORT_CATALOG } from './reports-catalog';
import type {
  BankProfile,
  JurisdictionPresence,
  ReportRecommendation,
  AssetSizeTier,
  Jurisdiction,
} from './types';

const TIER_TO_USD_B: Record<AssetSizeTier, number> = {
  lt_1B: 0.5,
  '1B_to_10B': 5,
  '10B_to_50B': 30,
  '50B_to_100B': 75,
  '100B_to_250B': 175,
  '250B_to_700B': 475,
  gt_700B: 1500,
  unknown: 0,
};

function presenceFor(profile: BankProfile, j: Jurisdiction): JurisdictionPresence | undefined {
  return profile.presence.find((p) => p.jurisdiction === j);
}

function presenceAssetsUsdB(profile: BankProfile, j: Jurisdiction): number {
  const p = presenceFor(profile, j);
  if (p?.jurisdictionAssetsUsdB && p.jurisdictionAssetsUsdB > 0) return p.jurisdictionAssetsUsdB;
  // Fallback: use global assets if the bank is HQ'd here.
  if (profile.hqCountry && jurisdictionContainsCountry(j, profile.hqCountry)) {
    return profile.globalAssetsUsdB ?? TIER_TO_USD_B[profile.assetSizeTier];
  }
  return 0;
}

function jurisdictionContainsCountry(j: Jurisdiction, country: string): boolean {
  const c = country.toUpperCase();
  if (j === 'US') return c === 'US' || c === 'USA';
  if (j === 'UK') return c === 'GB' || c === 'UK';
  if (j === 'IN') return c === 'IN' || c === 'IND';
  if (j === 'EU') {
    const eu = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    ];
    return eu.includes(c);
  }
  return false;
}

function rec(
  catalogId: keyof typeof REPORT_CATALOG,
  applicabilityReason: string,
  confidence: ReportRecommendation['confidence'] = 'high',
  evidenceFieldIds: string[] = [],
): ReportRecommendation {
  const e = REPORT_CATALOG[catalogId];
  // Every rec() implicitly depends on the jurisdiction's presence entry —
  // prepend it so the UI drawer always has a meaningful field to highlight
  // even when a specific rule didn't enumerate its evidence.
  const jur = e.jurisdiction;
  const allEvidence = [`presence.${jur}`, ...evidenceFieldIds];
  return {
    id: e.id,
    jurisdiction: e.jurisdiction,
    regulator: e.regulator,
    shortName: e.shortName,
    fullName: e.fullName,
    description: e.description,
    frequency: e.frequency,
    referenceUrl: e.referenceUrl,
    applicabilityReason,
    confidence,
    evidenceFieldIds: allEvidence,
  };
}

// ============================================================
// US RULES
// ============================================================
function usRules(profile: BankProfile): ReportRecommendation[] {
  const out: ReportRecommendation[] = [];
  const p = presenceFor(profile, 'US');
  if (!p) return out;

  const assetsB = presenceAssetsUsdB(profile, 'US');
  const isFBO = !!p.isFBO || profile.hqCountry !== undefined && profile.hqCountry.toUpperCase() !== 'US';
  const isHolding = p.entityType === 'bank_holding_company' || p.hasHoldingCompany;
  const hasForeignOffices =
    profile.presence.length > 1 ||
    (!!profile.globalAssetsUsdB && profile.globalAssetsUsdB > assetsB + 5);

  // ----- Call Reports (mutually exclusive) -----
  if (isFBO && (p.entityType === 'foreign_branch' || p.entityType === 'other')) {
    out.push(
      rec(
        'US_FFIEC_002',
        'Filed by U.S. branches and agencies of foreign banks; the bank operates in the U.S. as an FBO branch/agency.',
      ),
    );
  } else if (hasForeignOffices) {
    out.push(
      rec(
        'US_FFIEC_031',
        `Bank has both U.S. and foreign offices (≈ $${assetsB.toFixed(0)}B U.S. assets, multi-jurisdiction footprint).`,
      ),
    );
  } else if (assetsB >= 5) {
    out.push(
      rec(
        'US_FFIEC_041',
        `Domestic-only U.S. bank with assets ≥ $5B (≈ $${assetsB.toFixed(0)}B).`,
      ),
    );
  } else if (assetsB > 0) {
    out.push(
      rec(
        'US_FFIEC_051',
        `Domestic-only U.S. bank with assets < $5B (≈ $${assetsB.toFixed(0)}B); eligible for the streamlined Call Report.`,
      ),
    );
  }

  // ----- Holding company filings -----
  if (isHolding && assetsB >= 3) {
    out.push(rec('US_FR_Y_9C', 'U.S. holding company with consolidated assets ≥ $3B.'));
    out.push(rec('US_FR_Y_9LP', 'Parent-only filing required of FR Y-9C filers.'));
  } else if (isHolding && assetsB > 0) {
    out.push(rec('US_FR_Y_9SP', 'Small U.S. holding company with assets < $3B.'));
  }

  // ----- CCAR / DFAST / large-bank reporting -----
  if (assetsB >= 100) {
    out.push(
      rec(
        'US_FR_Y_14A',
        `Large BHC/IHC with assets ≥ $100B (≈ $${assetsB.toFixed(0)}B); subject to CCAR/DFAST stress testing.`,
      ),
    );
    out.push(rec('US_FR_Y_14Q', 'Quarterly CCAR/DFAST schedules accompany the annual FR Y-14A.'));
    out.push(rec('US_FR_Y_15', 'Systemic risk reporting (G-SIB scoring inputs) required at the $100B threshold.'));
    if (
      profile.activities.includes('mortgage_lending') ||
      profile.activities.includes('credit_cards')
    ) {
      out.push(
        rec(
          'US_FR_Y_14M',
          'Loan-level monthly schedules apply because the bank has material mortgage and/or credit-card portfolios.',
        ),
      );
    }
  }

  // ----- Liquidity (FR 2052a) — typically ≥ $100B Category I-IV -----
  if (assetsB >= 100) {
    out.push(
      rec(
        'US_FR_2052A',
        'Daily/monthly liquidity monitoring required for large U.S. banking organizations subject to the LCR.',
      ),
    );
  }

  // ----- Advanced approaches & market risk -----
  if (assetsB >= 250 || (profile.isGSIB && presenceFor(profile, 'US'))) {
    out.push(
      rec(
        'US_FFIEC_101',
        'Advanced-approaches capital reporting applies to institutions ≥ $250B (or with significant foreign exposure / G-SIBs).',
      ),
    );
  }
  if (
    profile.activities.includes('derivatives_trading') ||
    profile.activities.includes('securities_underwriting') ||
    profile.activities.includes('broker_dealer')
  ) {
    out.push(
      rec(
        'US_FFIEC_102',
        'Material trading / market-making activity triggers the market risk capital rule.',
      ),
    );
  }

  // ----- HMDA -----
  if (
    profile.activities.includes('mortgage_lending') &&
    (assetsB >= 0.057 || profile.category !== 'foreign_branch')
  ) {
    out.push(
      rec(
        'US_HMDA_LAR',
        'Bank originates residential mortgages and exceeds the HMDA reporting volume threshold.',
        'medium',
      ),
    );
  }

  // ----- CRA -----
  if (assetsB >= 1.609 && profile.isFDICInsured) {
    out.push(
      rec(
        'US_CRA',
        'FDIC-insured large bank (≥ $1.6B in assets) — subject to CRA data collection.',
        'medium',
      ),
    );
  }

  // ----- BSA / AML — every U.S. bank -----
  out.push(rec('US_FINCEN_SAR', 'All U.S. banks must file SARs for suspicious activity.'));
  out.push(rec('US_FINCEN_CTR', 'All U.S. banks must file CTRs for cash transactions > $10,000.'));

  // ----- Cross-border / TIC -----
  if (
    profile.activities.includes('cross_border_payments') ||
    profile.activities.includes('foreign_exchange') ||
    profile.activities.includes('trade_finance') ||
    hasForeignOffices ||
    isFBO
  ) {
    out.push(
      rec(
        'US_TIC_BL',
        'Material cross-border claims/liabilities trigger Treasury TIC banking-form reporting.',
        'medium',
      ),
    );
  }
  if (assetsB >= 30 && (hasForeignOffices || isFBO)) {
    out.push(
      rec(
        'US_FFIEC_009',
        'Country exposure reporting required for U.S. banks with significant foreign exposure (typically ≥ $30B).',
      ),
    );
  }

  // ----- Reserve / deposits -----
  if (assetsB >= 0.05) {
    out.push(
      rec(
        'US_FR_2900',
        'Deposit-reporting return retained for monetary statistics (filing tier depends on size).',
        'low',
      ),
    );
  }

  return out;
}

// ============================================================
// UK RULES
// ============================================================
function ukRules(profile: BankProfile): ReportRecommendation[] {
  const out: ReportRecommendation[] = [];
  const p = presenceFor(profile, 'UK');
  if (!p) return out;

  const assetsB = presenceAssetsUsdB(profile, 'UK');

  out.push(
    rec(
      'UK_PRA110',
      'PRA-authorised banks and building societies file the granular cash-flow mismatch return.',
    ),
  );
  out.push(
    rec(
      'UK_FSA047_048',
      'Daily/weekly liquidity flow returns apply under the PRA liquidity regime.',
      assetsB > 5 ? 'high' : 'medium',
    ),
  );

  if (
    profile.activities.includes('mortgage_lending') ||
    p.entityType === 'building_society'
  ) {
    out.push(rec('UK_MLAR', 'Bank/building society engages in UK mortgage lending or administration.'));
  }

  // Ring-fencing — applies to UK banking groups with > £25B (~$32B) of core deposits
  if (
    assetsB > 32 &&
    (p.entityType === 'commercial_bank' || p.entityType === 'bank_holding_company') &&
    !p.isFBO
  ) {
    out.push(
      rec(
        'UK_RFB',
        'Large UK retail banking group above the £25B core-deposit ring-fencing threshold.',
        'medium',
      ),
    );
  }

  return out;
}

// ============================================================
// EU RULES
// ============================================================
function euRules(profile: BankProfile): ReportRecommendation[] {
  const out: ReportRecommendation[] = [];
  const p = presenceFor(profile, 'EU');
  if (!p) return out;

  const assetsB = presenceAssetsUsdB(profile, 'EU');

  // COREP & FINREP — required of all CRR-scope institutions
  out.push(
    rec(
      'EU_COREP',
      'CRR-scope credit institution; COREP (own funds, large exposures, leverage, NSFR) is mandatory.',
    ),
  );
  out.push(
    rec(
      'EU_FINREP',
      'FINREP applies to credit institutions reporting under IFRS or above national thresholds.',
      'medium',
    ),
  );
  out.push(rec('EU_LCR', 'Monthly LCR templates within the COREP family apply to all CRR institutions.'));
  out.push(rec('EU_ALMM', 'Additional liquidity monitoring metrics complement the LCR.'));

  // AnaCredit
  if (
    profile.activities.includes('commercial_lending') ||
    profile.activities.includes('mortgage_lending')
  ) {
    out.push(
      rec(
        'EU_ANACREDIT',
        'Credit institution with corporate/SME lending — AnaCredit loan-level reporting applies (€25k threshold).',
      ),
    );
  }

  // MiFIR transaction reporting
  if (
    profile.activities.includes('securities_underwriting') ||
    profile.activities.includes('broker_dealer') ||
    profile.activities.includes('derivatives_trading') ||
    profile.activities.includes('asset_management')
  ) {
    out.push(
      rec(
        'EU_MIFIR',
        'Bank performs MiFID investment services — T+1 MiFIR Article 26 transaction reporting required.',
      ),
    );
  }

  // Pillar 3
  out.push(
    rec(
      'EU_PILLAR3',
      `Public Pillar 3 disclosures required (frequency depends on size; estimated assets ≈ $${assetsB.toFixed(0)}B).`,
    ),
  );

  // DORA — applies to virtually all EU financial entities from Jan 2025
  out.push(
    rec(
      'EU_DORA_REGISTER',
      'EU financial entity — DORA register of ICT third-party arrangements and incident reporting are mandatory.',
    ),
  );

  // FATCA / CRS
  out.push(rec('EU_FATCA_CRS', 'EU credit institutions are reporting financial institutions under CRS and FATCA.'));

  return out;
}

// ============================================================
// INDIA RULES
// ============================================================
function indiaRules(profile: BankProfile): ReportRecommendation[] {
  const out: ReportRecommendation[] = [];
  const p = presenceFor(profile, 'IN');
  if (!p) return out;

  const isScheduledBank =
    p.entityType === 'commercial_bank' ||
    p.entityType === 'cooperative_bank' ||
    p.entityType === 'small_finance_bank' ||
    p.entityType === 'payments_bank' ||
    p.entityType === 'foreign_branch';

  if (isScheduledBank) {
    out.push(rec('IN_DSB_RETURNS', 'Scheduled bank — RBI off-site surveillance (DSB) returns are mandatory.'));
    out.push(rec('IN_FORM_A_CRR', 'Section 42(2) CRR return is mandatory for scheduled banks.'));
    out.push(rec('IN_FORM_VIII_SLR', 'Section 24 SLR return is mandatory.'));
    out.push(rec('IN_FORM_X', 'Monthly Form X (Section 27) statement of assets & liabilities required.'));
    out.push(rec('IN_BSR1', 'Annual BSR-1 return on outstanding bank credit.'));
    out.push(rec('IN_BSR2', 'Annual BSR-2 return on deposits.'));
    out.push(rec('IN_CRILC', 'CRILC reporting on borrowers with aggregate exposure ≥ ₹5 crore.'));
    out.push(rec('IN_LFAR', 'Statutory auditors must submit the Long Form Audit Report annually.'));
    out.push(rec('IN_ALM_RETURNS', 'Asset-Liability Management returns under the RBI ALM framework.'));
    out.push(rec('IN_LCR_NSFR', 'Basel III LCR/NSFR returns apply to scheduled commercial banks.'));
    out.push(rec('IN_RBS_TRANCHE', 'Risk-Based Supervision tranche/RAQ data submitted annually under SPARC.'));
    out.push(rec('IN_ICAAP', 'Annual ICAAP submission under Pillar 2.'));
  }

  if (
    isScheduledBank &&
    (p.entityType === 'commercial_bank' || p.entityType === 'small_finance_bank' || profile.activities.includes('priority_sector_lending'))
  ) {
    out.push(
      rec(
        'IN_PSL_RETURN',
        'Domestic scheduled commercial bank (or SFB) — Priority Sector Lending returns apply.',
      ),
    );
  }

  // FX / cross-border
  if (
    profile.activities.includes('foreign_exchange') ||
    profile.activities.includes('cross_border_payments') ||
    profile.activities.includes('trade_finance') ||
    p.entityType === 'foreign_branch'
  ) {
    out.push(
      rec(
        'IN_FOREIGN_EXPOSURE',
        'AD-Category I activities — FETERS / R-Returns on FX transactions are mandatory.',
      ),
    );
  }

  // FATCA / CRS
  out.push(rec('IN_FATCA_CRS', 'Reporting financial institution under FATCA & CRS — Form 61B annual filing.'));

  // PMLA / FIU-IND
  out.push(
    rec(
      'IN_FIU_CTR_STR',
      'PMLA reporting (CTR/STR/NTR/CCR) to FIU-IND is mandatory for all banking companies.',
    ),
  );

  return out;
}

// ============================================================
// PUBLIC ENTRY POINT
// ============================================================
export function applyRules(profile: BankProfile): ReportRecommendation[] {
  const all = [
    ...usRules(profile),
    ...ukRules(profile),
    ...euRules(profile),
    ...indiaRules(profile),
  ];

  // De-duplicate by id, preferring the higher-confidence entry.
  const byId = new Map<string, ReportRecommendation>();
  for (const r of all) {
    const existing = byId.get(r.id);
    if (!existing) {
      byId.set(r.id, r);
      continue;
    }
    const rank: Record<ReportRecommendation['confidence'], number> = { high: 3, medium: 2, low: 1 };
    if (rank[r.confidence] > rank[existing.confidence]) byId.set(r.id, r);
  }
  return Array.from(byId.values());
}
