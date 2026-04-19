import { describe, it, expect } from 'vitest';
import { applyRules } from './rules';
import type { BankProfile } from './types';

function buildProfile(overrides: Partial<BankProfile>): BankProfile {
  return {
    legalName: 'Test Bank',
    category: 'commercial_bank',
    assetSizeTier: 'unknown',
    presence: [],
    activities: [],
    ...overrides,
  };
}

function ids(profile: BankProfile): string[] {
  return applyRules(profile).map((r) => r.id);
}

describe('applyRules', () => {
  it('dedupes by id and picks higher-confidence recommendations', () => {
    const reports = applyRules(
      buildProfile({
        hqCountry: 'US',
        category: 'bank_holding_company',
        assetSizeTier: 'gt_700B',
        globalAssetsUsdB: 3900,
        isFDICInsured: true,
        isGSIB: true,
        presence: [{ jurisdiction: 'US', entityType: 'bank_holding_company' }],
        activities: ['mortgage_lending', 'credit_cards'],
      }),
    );
    const uniqueIds = new Set(reports.map((r) => r.id));
    expect(uniqueIds.size).toBe(reports.length);
  });

  it('large US G-SIB gets CCAR + HMDA + FINCEN reports', () => {
    const result = ids(
      buildProfile({
        hqCountry: 'US',
        category: 'bank_holding_company',
        assetSizeTier: 'gt_700B',
        globalAssetsUsdB: 3900,
        isGSIB: true,
        isFDICInsured: true,
        isPubliclyListed: true,
        presence: [
          { jurisdiction: 'US', entityType: 'bank_holding_company', jurisdictionAssetsUsdB: 3400 },
          { jurisdiction: 'UK', entityType: 'foreign_branch' },
        ],
        activities: [
          'commercial_lending',
          'mortgage_lending',
          'credit_cards',
          'derivatives_trading',
          'securities_underwriting',
          'broker_dealer',
          'cross_border_payments',
        ],
      }),
    );
    expect(result).toContain('US_FR_Y_9C');
    expect(result).toContain('US_FR_Y_14A');
    expect(result).toContain('US_FR_Y_14Q');
    expect(result).toContain('US_FR_Y_14M');
    expect(result).toContain('US_FR_Y_15');
    expect(result).toContain('US_FFIEC_031');
    expect(result).toContain('US_HMDA_LAR');
    expect(result).toContain('US_FINCEN_SAR');
    expect(result).toContain('US_FINCEN_CTR');
  });

  it('small US community bank uses streamlined Call Report and skips CCAR', () => {
    const result = ids(
      buildProfile({
        hqCountry: 'US',
        category: 'commercial_bank',
        assetSizeTier: '1B_to_10B',
        globalAssetsUsdB: 2,
        isFDICInsured: true,
        presence: [{ jurisdiction: 'US', entityType: 'commercial_bank', jurisdictionAssetsUsdB: 2 }],
        activities: ['retail_deposits', 'commercial_lending'],
      }),
    );
    expect(result).toContain('US_FFIEC_051');
    expect(result).toContain('US_FINCEN_SAR');
    expect(result).not.toContain('US_FR_Y_14A');
    expect(result).not.toContain('US_FFIEC_031');
  });

  it('Indian scheduled commercial bank gets the core RBI returns', () => {
    const result = ids(
      buildProfile({
        legalName: 'HDFC Bank Limited',
        hqCountry: 'IN',
        category: 'commercial_bank',
        assetSizeTier: '250B_to_700B',
        globalAssetsUsdB: 400,
        isPubliclyListed: true,
        presence: [{ jurisdiction: 'IN', entityType: 'commercial_bank', jurisdictionAssetsUsdB: 400 }],
        activities: [
          'retail_deposits',
          'commercial_lending',
          'mortgage_lending',
          'priority_sector_lending',
          'foreign_exchange',
        ],
      }),
    );
    expect(result).toContain('IN_FORM_A_CRR');
    expect(result).toContain('IN_FORM_VIII_SLR');
    expect(result).toContain('IN_FORM_X');
    expect(result).toContain('IN_BSR1');
    expect(result).toContain('IN_BSR2');
    expect(result).toContain('IN_LCR_NSFR');
    expect(result).toContain('IN_PSL_RETURN');
    expect(result).toContain('IN_FATCA_CRS');
    expect(result).toContain('IN_FIU_CTR_STR');
  });

  it('UK bank with US FBO branch gets PRA110 and FFIEC 002', () => {
    const result = ids(
      buildProfile({
        legalName: 'Barclays PLC',
        hqCountry: 'GB',
        category: 'commercial_bank',
        assetSizeTier: 'gt_700B',
        globalAssetsUsdB: 1600,
        isGSIB: true,
        isPubliclyListed: true,
        presence: [
          { jurisdiction: 'UK', entityType: 'commercial_bank', jurisdictionAssetsUsdB: 1200 },
          { jurisdiction: 'US', entityType: 'foreign_branch', isFBO: true, jurisdictionAssetsUsdB: 300 },
        ],
        activities: ['commercial_lending', 'derivatives_trading', 'securities_underwriting', 'broker_dealer'],
      }),
    );
    expect(result).toContain('UK_PRA110');
    expect(result).toContain('US_FFIEC_002');
    expect(result).not.toContain('US_FFIEC_031');
    expect(result).not.toContain('US_FFIEC_041');
    expect(result).not.toContain('US_FFIEC_051');
  });

  it('Canadian bank gets OSFI Capital Adequacy + FINTRAC returns', () => {
    const result = ids(
      buildProfile({
        legalName: 'Royal Bank of Canada',
        hqCountry: 'CA',
        category: 'commercial_bank',
        assetSizeTier: 'gt_700B',
        globalAssetsUsdB: 1400,
        presence: [{ jurisdiction: 'CA', entityType: 'commercial_bank', jurisdictionAssetsUsdB: 1400 }],
        activities: ['retail_deposits', 'commercial_lending', 'mortgage_lending'],
      }),
    );
    expect(result).toContain('CA_CAR');
    expect(result).toContain('CA_A2_A1');
    expect(result).toContain('CA_FINTRAC_LCTR');
    expect(result).toContain('CA_LCR_NSFR');
  });

  it('Singapore MAS-licensed bank gets core MAS notices', () => {
    const result = ids(
      buildProfile({
        legalName: 'DBS Bank',
        hqCountry: 'SG',
        category: 'commercial_bank',
        assetSizeTier: '250B_to_700B',
        globalAssetsUsdB: 620,
        presence: [{ jurisdiction: 'SG', entityType: 'commercial_bank', jurisdictionAssetsUsdB: 500 }],
        activities: ['retail_deposits', 'commercial_lending', 'foreign_exchange'],
      }),
    );
    expect(result).toContain('SG_MAS_610');
    expect(result).toContain('SG_MAS_637');
    expect(result).toContain('SG_MAS_LCR');
    expect(result).toContain('SG_STR');
  });

  it('Hong Kong authorized institution gets HKMA returns', () => {
    const result = ids(
      buildProfile({
        legalName: 'HSBC Hong Kong',
        hqCountry: 'HK',
        category: 'commercial_bank',
        assetSizeTier: 'gt_700B',
        globalAssetsUsdB: 900,
        presence: [{ jurisdiction: 'HK', entityType: 'commercial_bank', jurisdictionAssetsUsdB: 900 }],
        activities: ['retail_deposits', 'commercial_lending'],
      }),
    );
    expect(result).toContain('HK_MA_BS1');
    expect(result).toContain('HK_CAR');
    expect(result).toContain('HK_LMR');
    expect(result).toContain('HK_DISCLOSURE');
    expect(result).toContain('HK_JFIU');
  });

  it('EU insurer gets Solvency II QRTs + SFCR, not banking reports', () => {
    const result = ids(
      buildProfile({
        legalName: 'Allianz SE',
        entityType: 'insurer',
        hqCountry: 'DE',
        category: 'property_casualty_insurer',
        assetSizeTier: 'gt_700B',
        globalAssetsUsdB: 1200,
        presence: [{ jurisdiction: 'EU', entityType: 'property_casualty_insurer' }],
        activities: [],
      }),
    );
    expect(result).toContain('EU_SOLVENCY_II_QRT');
    expect(result).toContain('EU_SOLVENCY_II_SFCR');
    // Banking rules should NOT fire for insurers:
    expect(result).not.toContain('EU_COREP');
    expect(result).not.toContain('US_FFIEC_031');
  });

  it('US crypto firm gets NYDFS BitLicense + FinCEN MSB, not banking reports', () => {
    const result = ids(
      buildProfile({
        legalName: 'Coinbase Inc.',
        entityType: 'crypto_firm',
        hqCountry: 'US',
        category: 'crypto_exchange',
        assetSizeTier: '10B_to_50B',
        globalAssetsUsdB: 20,
        isPubliclyListed: true,
        presence: [{ jurisdiction: 'US', entityType: 'crypto_exchange' }],
        activities: ['crypto_assets'],
      }),
    );
    expect(result).toContain('US_NYDFS_BITLICENSE');
    expect(result).toContain('US_FINCEN_MSB');
    expect(result).not.toContain('US_FFIEC_031');
    expect(result).not.toContain('US_FR_Y_9C');
  });

  it('bank with no US/UK/EU/IN presence returns an empty list', () => {
    const result = ids(
      buildProfile({
        legalName: 'Commercial Bank of Somewhere',
        hqCountry: 'JP',
        category: 'commercial_bank',
        assetSizeTier: '50B_to_100B',
        globalAssetsUsdB: 80,
        presence: [],
        activities: ['retail_deposits'],
      }),
    );
    expect(result).toEqual([]);
  });
});
