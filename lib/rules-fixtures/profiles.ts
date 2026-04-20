// Golden-fixture profiles for well-known banks. Used by
// lib/rules-golden.test.ts to snapshot the rules engine's output.
//
// Updating these profiles (or the rules engine) will change the snapshot;
// the test will fail until the snapshot is explicitly refreshed, so any
// rule tweak that regresses a real bank cannot silently ship.
//
// These are simplified regulator-classification profiles, not comprehensive
// research outputs. They reflect the rules-engine inputs only.

import type { BankProfile } from '../types';

export const JPMORGAN: BankProfile = {
  legalName: 'JPMorgan Chase & Co.',
  commonName: 'JPMorgan Chase',
  hqCountry: 'US',
  category: 'bank_holding_company',
  assetSizeTier: 'gt_700B',
  globalAssetsUsdB: 3900,
  isPubliclyListed: true,
  isGSIB: true,
  isDSIB: false,
  isFDICInsured: true,
  hasBrokerDealerSubsidiary: true,
  hasInsuranceSubsidiary: false,
  presence: [
    { jurisdiction: 'US', entityType: 'bank_holding_company', jurisdictionAssetsUsdB: 3400 },
    { jurisdiction: 'UK', entityType: 'commercial_bank', jurisdictionAssetsUsdB: 200 },
    { jurisdiction: 'EU', entityType: 'commercial_bank', jurisdictionAssetsUsdB: 150 },
  ],
  activities: [
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
  ],
};

export const HDFC_BANK: BankProfile = {
  legalName: 'HDFC Bank Limited',
  commonName: 'HDFC Bank',
  hqCountry: 'IN',
  category: 'commercial_bank',
  assetSizeTier: '250B_to_700B',
  globalAssetsUsdB: 460,
  isPubliclyListed: true,
  isGSIB: false,
  isDSIB: true,
  isFDICInsured: false,
  hasBrokerDealerSubsidiary: true,
  hasInsuranceSubsidiary: false,
  presence: [{ jurisdiction: 'IN', entityType: 'commercial_bank', jurisdictionAssetsUsdB: 460 }],
  activities: [
    'retail_deposits',
    'commercial_lending',
    'mortgage_lending',
    'credit_cards',
    'priority_sector_lending',
    'agriculture_lending',
    'foreign_exchange',
  ],
};

export const BARCLAYS: BankProfile = {
  legalName: 'Barclays PLC',
  commonName: 'Barclays',
  hqCountry: 'GB',
  category: 'commercial_bank',
  assetSizeTier: 'gt_700B',
  globalAssetsUsdB: 1600,
  isPubliclyListed: true,
  isGSIB: true,
  isFDICInsured: false,
  hasBrokerDealerSubsidiary: true,
  presence: [
    { jurisdiction: 'UK', entityType: 'commercial_bank', jurisdictionAssetsUsdB: 1200 },
    { jurisdiction: 'US', entityType: 'foreign_branch', isFBO: true, jurisdictionAssetsUsdB: 300 },
    { jurisdiction: 'EU', entityType: 'commercial_bank', jurisdictionAssetsUsdB: 100 },
  ],
  activities: [
    'commercial_lending',
    'mortgage_lending',
    'credit_cards',
    'derivatives_trading',
    'securities_underwriting',
    'broker_dealer',
    'asset_management',
  ],
};

export const DBS_BANK: BankProfile = {
  legalName: 'DBS Group Holdings',
  commonName: 'DBS Bank',
  hqCountry: 'SG',
  category: 'bank_holding_company',
  assetSizeTier: '250B_to_700B',
  globalAssetsUsdB: 620,
  isPubliclyListed: true,
  isDSIB: true,
  presence: [{ jurisdiction: 'SG', entityType: 'bank_holding_company', jurisdictionAssetsUsdB: 500 }],
  activities: ['retail_deposits', 'commercial_lending', 'foreign_exchange', 'trade_finance', 'asset_management'],
};

export const RBC: BankProfile = {
  legalName: 'Royal Bank of Canada',
  commonName: 'RBC',
  hqCountry: 'CA',
  category: 'commercial_bank',
  assetSizeTier: 'gt_700B',
  globalAssetsUsdB: 1400,
  isPubliclyListed: true,
  isDSIB: true,
  presence: [{ jurisdiction: 'CA', entityType: 'commercial_bank', jurisdictionAssetsUsdB: 1400 }],
  activities: ['retail_deposits', 'commercial_lending', 'mortgage_lending', 'credit_cards'],
};

export const HSBC_HK: BankProfile = {
  legalName: 'The Hongkong and Shanghai Banking Corporation Limited',
  commonName: 'HSBC Hong Kong',
  hqCountry: 'HK',
  category: 'commercial_bank',
  assetSizeTier: 'gt_700B',
  globalAssetsUsdB: 900,
  isPubliclyListed: false,
  isDSIB: true,
  presence: [{ jurisdiction: 'HK', entityType: 'commercial_bank', jurisdictionAssetsUsdB: 900 }],
  activities: ['retail_deposits', 'commercial_lending', 'mortgage_lending', 'foreign_exchange', 'trade_finance'],
};

export const GOLDEN_PROFILES: Array<{ name: string; profile: BankProfile }> = [
  { name: 'jpmorgan', profile: JPMORGAN },
  { name: 'hdfc-bank', profile: HDFC_BANK },
  { name: 'barclays', profile: BARCLAYS },
  { name: 'dbs-bank', profile: DBS_BANK },
  { name: 'rbc', profile: RBC },
  { name: 'hsbc-hk', profile: HSBC_HK },
];
