// Catalog of well-known regulatory reports across US, UK/EU, and India.
// Each entry is the *static* description; the rules engine decides whether
// each report applies to a specific bank based on its profile.

import type { ReportFrequency, Jurisdiction } from './types';

export interface CatalogEntry {
  id: string;
  jurisdiction: Jurisdiction;
  regulator: string;
  shortName: string;
  fullName: string;
  description: string;
  frequency: ReportFrequency;
  referenceUrl?: string;
}

export const REPORT_CATALOG: Record<string, CatalogEntry> = {
  // ============================================================
  // UNITED STATES
  // ============================================================
  US_FFIEC_031: {
    id: 'US_FFIEC_031',
    jurisdiction: 'US',
    regulator: 'FFIEC / FRB / FDIC / OCC',
    shortName: 'FFIEC 031',
    fullName: 'Consolidated Reports of Condition and Income for a Bank with Domestic and Foreign Offices',
    description:
      'The Call Report variant for institutions with both domestic and foreign offices; provides balance sheet, income statement, and risk data.',
    frequency: 'quarterly',
    referenceUrl: 'https://www.ffiec.gov/forms031.htm',
  },
  US_FFIEC_041: {
    id: 'US_FFIEC_041',
    jurisdiction: 'US',
    regulator: 'FFIEC / FRB / FDIC / OCC',
    shortName: 'FFIEC 041',
    fullName: 'Consolidated Reports of Condition and Income for a Bank with Domestic Offices Only',
    description:
      'Call Report for U.S. banks with only domestic offices and total assets ≥ $5 billion (or that elect to file).',
    frequency: 'quarterly',
    referenceUrl: 'https://www.ffiec.gov/forms041.htm',
  },
  US_FFIEC_051: {
    id: 'US_FFIEC_051',
    jurisdiction: 'US',
    regulator: 'FFIEC / FRB / FDIC / OCC',
    shortName: 'FFIEC 051',
    fullName: 'Streamlined Call Report for Small Domestic Banks',
    description:
      'Streamlined Call Report for institutions with < $5B in total assets and only domestic offices.',
    frequency: 'quarterly',
    referenceUrl: 'https://www.ffiec.gov/forms051.htm',
  },
  US_FFIEC_101: {
    id: 'US_FFIEC_101',
    jurisdiction: 'US',
    regulator: 'FFIEC',
    shortName: 'FFIEC 101',
    fullName: 'Regulatory Capital Reporting for Institutions Subject to the Advanced Capital Adequacy Framework',
    description:
      'Pillar 1 capital reporting for institutions subject to the U.S. advanced approaches (typically ≥ $250B in assets or qualifying foreign exposure).',
    frequency: 'quarterly',
    referenceUrl: 'https://www.ffiec.gov/forms101.htm',
  },
  US_FFIEC_102: {
    id: 'US_FFIEC_102',
    jurisdiction: 'US',
    regulator: 'FFIEC',
    shortName: 'FFIEC 102',
    fullName: 'Market Risk Regulatory Report',
    description:
      'Market risk capital reporting for institutions subject to the market-risk capital rule (significant trading activity).',
    frequency: 'quarterly',
    referenceUrl: 'https://www.ffiec.gov/forms102.htm',
  },
  US_FR_Y_9C: {
    id: 'US_FR_Y_9C',
    jurisdiction: 'US',
    regulator: 'Federal Reserve',
    shortName: 'FR Y-9C',
    fullName: 'Consolidated Financial Statements for Holding Companies',
    description:
      'Quarterly consolidated financial statements filed by U.S. bank holding companies, savings & loan holding companies, and intermediate holding companies of FBOs with ≥ $3B in assets.',
    frequency: 'quarterly',
    referenceUrl: 'https://www.federalreserve.gov/apps/reportforms/reportdetail.aspx?sOoYJ+5BzDal8cbqnRxZRg==',
  },
  US_FR_Y_9LP: {
    id: 'US_FR_Y_9LP',
    jurisdiction: 'US',
    regulator: 'Federal Reserve',
    shortName: 'FR Y-9LP',
    fullName: 'Parent Company Only Financial Statements for Large Holding Companies',
    description:
      'Parent-only financial statements filed by holding companies that file the FR Y-9C.',
    frequency: 'quarterly',
  },
  US_FR_Y_9SP: {
    id: 'US_FR_Y_9SP',
    jurisdiction: 'US',
    regulator: 'Federal Reserve',
    shortName: 'FR Y-9SP',
    fullName: 'Parent Company Only Financial Statements for Small Holding Companies',
    description:
      'Semiannual parent-only filing for holding companies with total assets < $3B.',
    frequency: 'semi_annual',
  },
  US_FR_Y_14A: {
    id: 'US_FR_Y_14A',
    jurisdiction: 'US',
    regulator: 'Federal Reserve',
    shortName: 'FR Y-14A',
    fullName: 'Capital Assessments and Stress Testing — Annual',
    description:
      'CCAR/DFAST annual stress test submission for large bank holding companies (generally ≥ $100B).',
    frequency: 'annual',
  },
  US_FR_Y_14Q: {
    id: 'US_FR_Y_14Q',
    jurisdiction: 'US',
    regulator: 'Federal Reserve',
    shortName: 'FR Y-14Q',
    fullName: 'Capital Assessments and Stress Testing — Quarterly',
    description:
      'Quarterly schedules supporting CCAR/DFAST: portfolio, PPNR, balance, and operational risk data.',
    frequency: 'quarterly',
  },
  US_FR_Y_14M: {
    id: 'US_FR_Y_14M',
    jurisdiction: 'US',
    regulator: 'Federal Reserve',
    shortName: 'FR Y-14M',
    fullName: 'Capital Assessments and Stress Testing — Monthly',
    description:
      'Monthly loan-level data on first-lien mortgages, home equity, and credit card portfolios for large BHCs.',
    frequency: 'monthly',
  },
  US_FR_2052A: {
    id: 'US_FR_2052A',
    jurisdiction: 'US',
    regulator: 'Federal Reserve',
    shortName: 'FR 2052a',
    fullName: 'Complex Institution Liquidity Monitoring Report',
    description:
      'Daily/monthly liquidity monitoring report for large U.S. banking organizations and FBOs subject to the LCR.',
    frequency: 'daily',
  },
  US_FR_Y_15: {
    id: 'US_FR_Y_15',
    jurisdiction: 'US',
    regulator: 'Federal Reserve',
    shortName: 'FR Y-15',
    fullName: 'Banking Organization Systemic Risk Report',
    description:
      'Systemic risk indicators (size, interconnectedness, complexity) for organizations with ≥ $100B in assets; basis for G-SIB scoring.',
    frequency: 'quarterly',
  },
  US_HMDA_LAR: {
    id: 'US_HMDA_LAR',
    jurisdiction: 'US',
    regulator: 'CFPB / FFIEC',
    shortName: 'HMDA LAR',
    fullName: 'Home Mortgage Disclosure Act Loan/Application Register',
    description:
      'Annual register of mortgage applications and originations; required of depository and certain non-depository mortgage lenders meeting volume thresholds.',
    frequency: 'annual',
  },
  US_CRA: {
    id: 'US_CRA',
    jurisdiction: 'US',
    regulator: 'OCC / FDIC / FRB',
    shortName: 'CRA Data',
    fullName: 'Community Reinvestment Act Reporting',
    description:
      'Small business, small farm, and community development lending data collected from large CRA-covered institutions.',
    frequency: 'annual',
  },
  US_FINCEN_SAR: {
    id: 'US_FINCEN_SAR',
    jurisdiction: 'US',
    regulator: 'FinCEN',
    shortName: 'SAR',
    fullName: 'Suspicious Activity Report',
    description:
      'BSA filing for suspicious transactions; required of all U.S. banks and many non-bank financial institutions.',
    frequency: 'event_driven',
  },
  US_FINCEN_CTR: {
    id: 'US_FINCEN_CTR',
    jurisdiction: 'US',
    regulator: 'FinCEN',
    shortName: 'CTR',
    fullName: 'Currency Transaction Report',
    description:
      'BSA filing for cash transactions exceeding $10,000 in a business day.',
    frequency: 'event_driven',
  },
  US_TIC_BL: {
    id: 'US_TIC_BL',
    jurisdiction: 'US',
    regulator: 'U.S. Treasury',
    shortName: 'TIC B-Forms',
    fullName: 'Treasury International Capital — Banking Forms (BC, BL, BQ)',
    description:
      'Cross-border claims and liabilities reporting for U.S.-resident banks and broker-dealers above filing thresholds.',
    frequency: 'monthly',
  },
  US_FFIEC_009: {
    id: 'US_FFIEC_009',
    jurisdiction: 'US',
    regulator: 'FFIEC',
    shortName: 'FFIEC 009',
    fullName: 'Country Exposure Report',
    description:
      'Quarterly report of cross-border and foreign-office exposures for U.S. banks with significant foreign exposure.',
    frequency: 'quarterly',
  },
  US_FR_2900: {
    id: 'US_FR_2900',
    jurisdiction: 'US',
    regulator: 'Federal Reserve',
    shortName: 'FR 2900',
    fullName: 'Report of Transaction Accounts, Other Deposits, and Vault Cash',
    description:
      'Deposit reporting that historically supported reserve requirements; still used for monetary statistics.',
    frequency: 'weekly',
  },
  US_FFIEC_002: {
    id: 'US_FFIEC_002',
    jurisdiction: 'US',
    regulator: 'FFIEC',
    shortName: 'FFIEC 002',
    fullName: 'Report of Assets and Liabilities of U.S. Branches and Agencies of Foreign Banks',
    description:
      'Quarterly Call-Report equivalent filed by U.S. branches and agencies of foreign banks (FBOs).',
    frequency: 'quarterly',
  },

  // ============================================================
  // UNITED KINGDOM
  // ============================================================
  UK_PRA110: {
    id: 'UK_PRA110',
    jurisdiction: 'UK',
    regulator: 'PRA',
    shortName: 'PRA110',
    fullName: 'Cash-Flow Mismatch Liquidity Reporting',
    description:
      'Granular cash-flow mismatch return for PRA-authorised banks and building societies.',
    frequency: 'monthly',
  },
  UK_MLAR: {
    id: 'UK_MLAR',
    jurisdiction: 'UK',
    regulator: 'FCA / PRA',
    shortName: 'MLAR',
    fullName: 'Mortgage Lenders & Administrators Return',
    description:
      'Quarterly statistical return for UK mortgage lenders and administrators.',
    frequency: 'quarterly',
  },
  UK_RFB: {
    id: 'UK_RFB',
    jurisdiction: 'UK',
    regulator: 'PRA',
    shortName: 'Ring-fencing returns',
    fullName: 'Ring-Fenced Body Reporting (RFB001 etc.)',
    description:
      'Returns for UK ring-fenced banks under the structural reform regime (groups > £25B core deposits).',
    frequency: 'quarterly',
  },
  UK_FSA047_048: {
    id: 'UK_FSA047_048',
    jurisdiction: 'UK',
    regulator: 'PRA',
    shortName: 'FSA047/048',
    fullName: 'Daily/Weekly Liquidity Flows',
    description:
      'Daily and weekly liquidity flow returns for firms in the PRA Liquidity regime.',
    frequency: 'daily',
  },

  // ============================================================
  // EUROPEAN UNION (CRR/CRD)
  // ============================================================
  EU_COREP: {
    id: 'EU_COREP',
    jurisdiction: 'EU',
    regulator: 'EBA / National Competent Authority',
    shortName: 'COREP',
    fullName: 'Common Reporting Framework (Own Funds, Capital, Leverage, Large Exposures, NSFR)',
    description:
      'Harmonised prudential reporting required of all CRR-scope institutions: own funds, capital adequacy, leverage ratio, large exposures, NSFR.',
    frequency: 'quarterly',
  },
  EU_FINREP: {
    id: 'EU_FINREP',
    jurisdiction: 'EU',
    regulator: 'EBA / National Competent Authority',
    shortName: 'FINREP',
    fullName: 'Financial Reporting Framework',
    description:
      'Consolidated financial information based on IFRS/national GAAP; mandatory for IFRS-reporting institutions and others above thresholds.',
    frequency: 'quarterly',
  },
  EU_LCR: {
    id: 'EU_LCR',
    jurisdiction: 'EU',
    regulator: 'EBA',
    shortName: 'LCR (C 72-76)',
    fullName: 'Liquidity Coverage Ratio Reporting',
    description:
      'Monthly LCR templates within the COREP family for all CRR-scope institutions.',
    frequency: 'monthly',
  },
  EU_ALMM: {
    id: 'EU_ALMM',
    jurisdiction: 'EU',
    regulator: 'EBA',
    shortName: 'ALMM',
    fullName: 'Additional Liquidity Monitoring Metrics',
    description:
      'Maturity ladder, concentration of funding, and price/rollover metrics complementing the LCR.',
    frequency: 'monthly',
  },
  EU_ANACREDIT: {
    id: 'EU_ANACREDIT',
    jurisdiction: 'EU',
    regulator: 'ECB / National Central Bank',
    shortName: 'AnaCredit',
    fullName: 'Analytical Credit Datasets',
    description:
      'Granular loan-by-loan reporting on credit exposures to legal entities ≥ €25,000.',
    frequency: 'monthly',
  },
  EU_MIFIR: {
    id: 'EU_MIFIR',
    jurisdiction: 'EU',
    regulator: 'ESMA / NCA',
    shortName: 'MiFIR Transaction Reporting',
    fullName: 'MiFIR Article 26 Transaction Reporting',
    description:
      'T+1 transaction reporting for instruments traded on EU venues, applicable to investment firms and credit institutions performing investment services.',
    frequency: 'daily',
  },
  EU_PILLAR3: {
    id: 'EU_PILLAR3',
    jurisdiction: 'EU',
    regulator: 'EBA',
    shortName: 'Pillar 3 disclosures',
    fullName: 'CRR Part 8 Pillar 3 Disclosures',
    description:
      'Public disclosures on capital, risk exposures, and remuneration required of CRR-scope institutions; frequency depends on size category.',
    frequency: 'semi_annual',
  },
  EU_DORA_REGISTER: {
    id: 'EU_DORA_REGISTER',
    jurisdiction: 'EU',
    regulator: 'NCA / ESAs',
    shortName: 'DORA Register',
    fullName: 'DORA Register of Information on ICT Third-Party Arrangements',
    description:
      'Register of ICT third-party service-provider contracts mandated by DORA; major ICT-related incident reporting also required.',
    frequency: 'annual',
  },
  EU_FATCA_CRS: {
    id: 'EU_FATCA_CRS',
    jurisdiction: 'EU',
    regulator: 'National Tax Authority',
    shortName: 'FATCA / CRS',
    fullName: 'Automatic Exchange of Financial Account Information',
    description:
      'Annual reporting of reportable accounts under the OECD CRS and U.S. FATCA.',
    frequency: 'annual',
  },

  // ============================================================
  // INDIA (RBI)
  // ============================================================
  IN_DSB_RETURNS: {
    id: 'IN_DSB_RETURNS',
    jurisdiction: 'IN',
    regulator: 'RBI',
    shortName: 'DSB Returns I-XII',
    fullName: 'Department of Supervision (Off-Site Surveillance) Returns',
    description:
      'Off-site monitoring returns covering assets/liabilities, capital adequacy, asset quality, large credits, and connected lending; required of all scheduled commercial banks.',
    frequency: 'quarterly',
  },
  IN_FORM_A_CRR: {
    id: 'IN_FORM_A_CRR',
    jurisdiction: 'IN',
    regulator: 'RBI',
    shortName: 'Form A (CRR)',
    fullName: 'Section 42(2) Return — Cash Reserve Ratio',
    description:
      'Fortnightly Friday-position return for Cash Reserve Ratio compliance under Section 42 of the RBI Act.',
    frequency: 'fortnightly',
  },
  IN_FORM_VIII_SLR: {
    id: 'IN_FORM_VIII_SLR',
    jurisdiction: 'IN',
    regulator: 'RBI',
    shortName: 'Form VIII (SLR)',
    fullName: 'Section 24 Return — Statutory Liquidity Ratio',
    description:
      'Monthly return on Statutory Liquidity Ratio holdings under Section 24 of the Banking Regulation Act.',
    frequency: 'monthly',
  },
  IN_FORM_X: {
    id: 'IN_FORM_X',
    jurisdiction: 'IN',
    regulator: 'RBI',
    shortName: 'Form X',
    fullName: 'Section 27 Return — Monthly Statement of Assets & Liabilities',
    description:
      'Monthly return on assets and liabilities under Section 27 of the Banking Regulation Act.',
    frequency: 'monthly',
  },
  IN_BSR1: {
    id: 'IN_BSR1',
    jurisdiction: 'IN',
    regulator: 'RBI',
    shortName: 'BSR-1',
    fullName: 'Basic Statistical Return on Outstanding Credit',
    description:
      'Annual account-level data on outstanding bank credit (Part A: large accounts; Part B: small accounts).',
    frequency: 'annual',
  },
  IN_BSR2: {
    id: 'IN_BSR2',
    jurisdiction: 'IN',
    regulator: 'RBI',
    shortName: 'BSR-2',
    fullName: 'Basic Statistical Return on Deposits',
    description:
      'Annual data on deposit accounts by ownership and type.',
    frequency: 'annual',
  },
  IN_CRILC: {
    id: 'IN_CRILC',
    jurisdiction: 'IN',
    regulator: 'RBI',
    shortName: 'CRILC',
    fullName: 'Central Repository of Information on Large Credits',
    description:
      'Quarterly reporting on borrowers with aggregate exposure ≥ ₹5 crore; weekly SMA-2 reporting for borrowers with default risk.',
    frequency: 'quarterly',
  },
  IN_LFAR: {
    id: 'IN_LFAR',
    jurisdiction: 'IN',
    regulator: 'RBI',
    shortName: 'LFAR',
    fullName: 'Long Form Audit Report',
    description:
      'Annual report by statutory auditors on the bank covering credit, treasury, internal control, and other operational areas.',
    frequency: 'annual',
  },
  IN_ALM_RETURNS: {
    id: 'IN_ALM_RETURNS',
    jurisdiction: 'IN',
    regulator: 'RBI',
    shortName: 'ALM Returns',
    fullName: 'Structural & Dynamic Liquidity Statements',
    description:
      'Structural liquidity, short-term dynamic liquidity, and interest-rate sensitivity returns under the ALM framework.',
    frequency: 'fortnightly',
  },
  IN_LCR_NSFR: {
    id: 'IN_LCR_NSFR',
    jurisdiction: 'IN',
    regulator: 'RBI',
    shortName: 'LCR / NSFR',
    fullName: 'Basel III Liquidity Coverage Ratio & Net Stable Funding Ratio Returns',
    description:
      'Monthly LCR and quarterly NSFR returns for scheduled commercial banks under the Basel III liquidity framework.',
    frequency: 'monthly',
  },
  IN_RBS_TRANCHE: {
    id: 'IN_RBS_TRANCHE',
    jurisdiction: 'IN',
    regulator: 'RBI',
    shortName: 'RBS Tranche / RAQ',
    fullName: 'Risk-Based Supervision Tranche Data and Risk Assessment Questionnaire',
    description:
      'Annual risk profile data submitted to RBI under the SPARC supervisory model.',
    frequency: 'annual',
  },
  IN_PSL_RETURN: {
    id: 'IN_PSL_RETURN',
    jurisdiction: 'IN',
    regulator: 'RBI',
    shortName: 'Priority Sector Returns',
    fullName: 'Priority Sector Lending — Quarterly & Annual Returns',
    description:
      'Quarterly (Statement III) and annual (PSLP) returns on priority sector advances and PSL Certificates.',
    frequency: 'quarterly',
  },
  IN_FATCA_CRS: {
    id: 'IN_FATCA_CRS',
    jurisdiction: 'IN',
    regulator: 'CBDT / Income Tax Department',
    shortName: 'FATCA / CRS (Form 61B)',
    fullName: 'Statement of Reportable Accounts (Form 61B)',
    description:
      'Annual reporting of reportable accounts to CBDT under FATCA (US IGA) and CRS.',
    frequency: 'annual',
  },
  IN_FIU_CTR_STR: {
    id: 'IN_FIU_CTR_STR',
    jurisdiction: 'IN',
    regulator: 'FIU-IND',
    shortName: 'CTR / STR / NTR / CCR',
    fullName: 'PMLA Reports to Financial Intelligence Unit — India',
    description:
      'Cash Transaction Reports, Suspicious Transaction Reports, Non-profit Organization Transaction Reports, and Cross-border Wire Transfer Reports under PMLA.',
    frequency: 'event_driven',
  },
  IN_FOREIGN_EXPOSURE: {
    id: 'IN_FOREIGN_EXPOSURE',
    jurisdiction: 'IN',
    regulator: 'RBI',
    shortName: 'FETERS / R-Returns',
    fullName: 'Foreign Exchange Transactions Electronic Reporting System',
    description:
      'Daily/fortnightly returns on foreign exchange transactions and balances by AD-Category I banks.',
    frequency: 'fortnightly',
  },
  IN_ICAAP: {
    id: 'IN_ICAAP',
    jurisdiction: 'IN',
    regulator: 'RBI',
    shortName: 'ICAAP',
    fullName: 'Internal Capital Adequacy Assessment Process Document',
    description:
      'Annual ICAAP submission by all commercial banks under Pillar 2 of the Basel framework.',
    frequency: 'annual',
  },

  // ============================================================
  // CANADA (OSFI)
  // ============================================================
  CA_CAR: {
    id: 'CA_CAR',
    jurisdiction: 'CA',
    regulator: 'OSFI',
    shortName: 'CAR Return',
    fullName: 'Capital Adequacy Return',
    description:
      'Quarterly capital adequacy reporting for Canadian banks and bank holding companies under OSFI Capital Adequacy Requirements Guideline.',
    frequency: 'quarterly',
    referenceUrl: 'https://www.osfi-bsif.gc.ca/',
  },
  CA_LCR_NSFR: {
    id: 'CA_LCR_NSFR',
    jurisdiction: 'CA',
    regulator: 'OSFI',
    shortName: 'LCR / NSFR',
    fullName: 'Liquidity Coverage Ratio / Net Stable Funding Ratio',
    description:
      'Monthly LCR and quarterly NSFR returns under OSFI Liquidity Adequacy Requirements.',
    frequency: 'monthly',
  },
  CA_A2_A1: {
    id: 'CA_A2_A1',
    jurisdiction: 'CA',
    regulator: 'OSFI',
    shortName: 'A2 / A1 Returns',
    fullName: 'Balance Sheet and Income Statement Returns',
    description:
      'Monthly balance sheet (A2) and income statement (A1) returns filed by federally regulated deposit-taking institutions.',
    frequency: 'monthly',
  },
  CA_FINTRAC_LCTR: {
    id: 'CA_FINTRAC_LCTR',
    jurisdiction: 'CA',
    regulator: 'FINTRAC',
    shortName: 'LCTR / STR',
    fullName: 'Large Cash + Suspicious Transaction Reports',
    description:
      'Mandatory reports to FINTRAC on large cash transactions (≥ CAD 10,000) and suspicious transactions under the PCMLTFA.',
    frequency: 'event_driven',
  },
  CA_LRR: {
    id: 'CA_LRR',
    jurisdiction: 'CA',
    regulator: 'OSFI',
    shortName: 'LRR',
    fullName: 'Leverage Requirements Return',
    description:
      'Quarterly leverage ratio return under the OSFI Leverage Requirements Guideline.',
    frequency: 'quarterly',
  },

  // ============================================================
  // SINGAPORE (MAS)
  // ============================================================
  SG_MAS_610: {
    id: 'SG_MAS_610',
    jurisdiction: 'SG',
    regulator: 'MAS',
    shortName: 'MAS 610',
    fullName: 'Notice 610 Statistical Returns',
    description:
      'Monthly statistical returns on assets, liabilities, and income by MAS-licensed banks in Singapore.',
    frequency: 'monthly',
    referenceUrl: 'https://www.mas.gov.sg/',
  },
  SG_MAS_757: {
    id: 'SG_MAS_757',
    jurisdiction: 'SG',
    regulator: 'MAS',
    shortName: 'MAS 757',
    fullName: 'Notice 757 Lending of Singapore Dollars to Non-Resident Financial Institutions',
    description:
      'Singapore-dollar lending restrictions and monthly reporting for MAS-licensed banks.',
    frequency: 'monthly',
  },
  SG_MAS_637: {
    id: 'SG_MAS_637',
    jurisdiction: 'SG',
    regulator: 'MAS',
    shortName: 'MAS 637',
    fullName: 'Notice 637 Risk-Based Capital Adequacy for Banks',
    description:
      'Quarterly capital adequacy reporting for MAS-licensed banks under the Basel framework adopted in Singapore.',
    frequency: 'quarterly',
  },
  SG_MAS_LCR: {
    id: 'SG_MAS_LCR',
    jurisdiction: 'SG',
    regulator: 'MAS',
    shortName: 'MAS 649',
    fullName: 'Notice 649 Minimum Liquid Assets and Liquidity Coverage Ratio',
    description:
      'Daily and monthly liquidity reporting for MAS-licensed banks.',
    frequency: 'daily',
  },
  SG_STR: {
    id: 'SG_STR',
    jurisdiction: 'SG',
    regulator: 'STRO (CAD)',
    shortName: 'STR',
    fullName: 'Suspicious Transaction Report',
    description:
      'Event-driven STR filing to the Suspicious Transaction Reporting Office under the CDSA.',
    frequency: 'event_driven',
  },

  // ============================================================
  // HONG KONG (HKMA)
  // ============================================================
  HK_MA_BS1: {
    id: 'HK_MA_BS1',
    jurisdiction: 'HK',
    regulator: 'HKMA',
    shortName: 'MA(BS)1',
    fullName: 'Monthly Return of Assets and Liabilities',
    description:
      'Monthly balance sheet return filed by authorized institutions to the HKMA.',
    frequency: 'monthly',
    referenceUrl: 'https://www.hkma.gov.hk/',
  },
  HK_CAR: {
    id: 'HK_CAR',
    jurisdiction: 'HK',
    regulator: 'HKMA',
    shortName: 'Capital Adequacy Ratio',
    fullName: 'Capital Adequacy Return',
    description:
      'Quarterly CAR return under the HK Banking (Capital) Rules (Basel III adoption in HK).',
    frequency: 'quarterly',
  },
  HK_LMR: {
    id: 'HK_LMR',
    jurisdiction: 'HK',
    regulator: 'HKMA',
    shortName: 'LMR / LCR',
    fullName: 'Liquidity Maintenance Ratio / Liquidity Coverage Ratio',
    description:
      'Monthly liquidity reporting (LMR for category-2 AIs, LCR for category-1 AIs) under the HK Banking (Liquidity) Rules.',
    frequency: 'monthly',
  },
  HK_DISCLOSURE: {
    id: 'HK_DISCLOSURE',
    jurisdiction: 'HK',
    regulator: 'HKMA',
    shortName: 'Banking Disclosure',
    fullName: 'Banking Disclosure Statement',
    description:
      'Semi-annual public disclosures under the HK Banking (Disclosure) Rules — Pillar 3 equivalent.',
    frequency: 'semi_annual',
  },
  HK_JFIU: {
    id: 'HK_JFIU',
    jurisdiction: 'HK',
    regulator: 'JFIU',
    shortName: 'STR',
    fullName: 'Suspicious Transaction Report to the Joint Financial Intelligence Unit',
    description:
      'Event-driven STR filing under the Organized and Serious Crimes Ordinance.',
    frequency: 'event_driven',
  },

  // ============================================================
  // INSURANCE — minimal viable coverage (NAIC + Solvency II + IRDAI)
  // ============================================================
  US_NAIC_ANNUAL: {
    id: 'US_NAIC_ANNUAL',
    jurisdiction: 'US',
    regulator: 'NAIC / State DOI',
    shortName: 'NAIC Annual Statement',
    fullName: 'NAIC Annual Statement (Blue/Green/Yellow/Orange book)',
    description:
      'Annual statutory financial filing with the NAIC and state insurance regulators. Color-coded by line of business.',
    frequency: 'annual',
    referenceUrl: 'https://www.naic.org/',
  },
  US_NAIC_ORSA: {
    id: 'US_NAIC_ORSA',
    jurisdiction: 'US',
    regulator: 'NAIC / State DOI',
    shortName: 'ORSA',
    fullName: 'Own Risk and Solvency Assessment Summary Report',
    description:
      'Annual ORSA summary for US insurers exceeding NAIC premium/volume thresholds.',
    frequency: 'annual',
  },
  EU_SOLVENCY_II_QRT: {
    id: 'EU_SOLVENCY_II_QRT',
    jurisdiction: 'EU',
    regulator: 'EIOPA / NCA',
    shortName: 'Solvency II QRTs',
    fullName: 'Solvency II Quantitative Reporting Templates (S.02-S.32)',
    description:
      'Quarterly and annual Solvency II QRTs submitted to the home National Competent Authority.',
    frequency: 'quarterly',
    referenceUrl: 'https://www.eiopa.europa.eu/',
  },
  EU_SOLVENCY_II_SFCR: {
    id: 'EU_SOLVENCY_II_SFCR',
    jurisdiction: 'EU',
    regulator: 'EIOPA / NCA',
    shortName: 'SFCR / RSR',
    fullName: 'Solvency and Financial Condition Report & Regular Supervisory Report',
    description:
      'Annual public SFCR + confidential RSR under Solvency II Articles 51 and 35.',
    frequency: 'annual',
  },
  IN_IRDAI_PUBLIC: {
    id: 'IN_IRDAI_PUBLIC',
    jurisdiction: 'IN',
    regulator: 'IRDAI',
    shortName: 'IRDAI Public Disclosures',
    fullName: 'Public Disclosures by Insurers',
    description:
      'Quarterly and annual public disclosures mandated by IRDAI (Investment, Solvency, Claims Paid).',
    frequency: 'quarterly',
    referenceUrl: 'https://www.irdai.gov.in/',
  },

  // ============================================================
  // CRYPTO / DIGITAL ASSETS — minimal viable coverage
  // ============================================================
  EU_MICA_PERIODIC: {
    id: 'EU_MICA_PERIODIC',
    jurisdiction: 'EU',
    regulator: 'ESMA / EBA / NCA',
    shortName: 'MiCA Periodic Report',
    fullName: 'Markets in Crypto-Assets Regulation Periodic Reporting',
    description:
      'Ongoing reporting by authorised CASPs, ART/EMT issuers under the EU MiCA regulation.',
    frequency: 'quarterly',
  },
  EU_MICA_ART_EMT: {
    id: 'EU_MICA_ART_EMT',
    jurisdiction: 'EU',
    regulator: 'EBA',
    shortName: 'ART/EMT Whitepaper',
    fullName: 'Asset-Referenced / E-Money Token Whitepaper',
    description:
      'Mandatory whitepaper + ongoing reserve disclosures under MiCA Titles III/IV for stablecoin issuers.',
    frequency: 'event_driven',
  },
  US_NYDFS_BITLICENSE: {
    id: 'US_NYDFS_BITLICENSE',
    jurisdiction: 'US',
    regulator: 'NYDFS',
    shortName: 'BitLicense Annual Report',
    fullName: '23 NYCRR Part 200 Annual Financial Statement + Transaction Monitoring Report',
    description:
      'Annual financial statement + transaction-monitoring-program certification for NYDFS BitLicense holders.',
    frequency: 'annual',
  },
  US_FINCEN_MSB: {
    id: 'US_FINCEN_MSB',
    jurisdiction: 'US',
    regulator: 'FinCEN',
    shortName: 'MSB SAR / 8300',
    fullName: 'Money Services Business BSA Filings',
    description:
      'SAR, CTR, and Form 8300 filings for money-services businesses (including many crypto firms) under 31 CFR §1022.',
    frequency: 'event_driven',
  },

  // ============================================================
  // SEC — Securities and Exchange Commission
  // ============================================================
  US_SEC_10K: {
    id: 'US_SEC_10K',
    jurisdiction: 'US',
    regulator: 'SEC',
    shortName: 'Form 10-K',
    fullName: 'Annual Report Pursuant to Section 13 or 15(d)',
    description:
      'Annual comprehensive report filed by US public companies — audited financials, MD&A, risk factors, and governance disclosures.',
    frequency: 'annual',
    referenceUrl: 'https://www.sec.gov/forms',
  },
  US_SEC_10Q: {
    id: 'US_SEC_10Q',
    jurisdiction: 'US',
    regulator: 'SEC',
    shortName: 'Form 10-Q',
    fullName: 'Quarterly Report Pursuant to Section 13 or 15(d)',
    description:
      'Unaudited quarterly financial statements + MD&A for US public companies between 10-Ks.',
    frequency: 'quarterly',
  },
  US_SEC_8K: {
    id: 'US_SEC_8K',
    jurisdiction: 'US',
    regulator: 'SEC',
    shortName: 'Form 8-K',
    fullName: 'Current Report',
    description:
      'Event-driven disclosures (material agreements, management changes, bankruptcy, etc.) filed within 4 business days.',
    frequency: 'event_driven',
  },
  US_SEC_13F: {
    id: 'US_SEC_13F',
    jurisdiction: 'US',
    regulator: 'SEC',
    shortName: 'Form 13F',
    fullName: 'Quarterly Report of Institutional Investment Managers',
    description:
      'Quarterly holdings disclosure by institutional investment managers with ≥ $100M in 13(f)-securities.',
    frequency: 'quarterly',
  },
  US_SEC_13DG: {
    id: 'US_SEC_13DG',
    jurisdiction: 'US',
    regulator: 'SEC',
    shortName: 'Schedule 13D / 13G',
    fullName: 'Beneficial Ownership Reports',
    description:
      'Filed within 10 days (13D) or annually (13G) by any person/entity that acquires ≥ 5% of a public company\'s voting securities.',
    frequency: 'event_driven',
  },
  US_SEC_ADV: {
    id: 'US_SEC_ADV',
    jurisdiction: 'US',
    regulator: 'SEC',
    shortName: 'Form ADV',
    fullName: 'Uniform Application for Investment Adviser Registration',
    description:
      'Annual registration + brochure (Parts 1 & 2) for SEC-registered investment advisers; filed via IARD.',
    frequency: 'annual',
  },
  US_SEC_N1A: {
    id: 'US_SEC_N1A',
    jurisdiction: 'US',
    regulator: 'SEC',
    shortName: 'Form N-1A',
    fullName: 'Registration Statement for Open-End Management Investment Companies',
    description:
      'Mutual-fund prospectus + statement of additional information filing; required for open-end funds.',
    frequency: 'annual',
  },

  // ============================================================
  // FDIC — expanded
  // ============================================================
  US_FDIC_SDI: {
    id: 'US_FDIC_SDI',
    jurisdiction: 'US',
    regulator: 'FDIC',
    shortName: 'SDI',
    fullName: 'Statistics on Depository Institutions',
    description:
      'Quarterly aggregated financial data on FDIC-insured banks, published for transparency and peer benchmarking.',
    frequency: 'quarterly',
    referenceUrl: 'https://banks.data.fdic.gov/',
  },
  US_FDIC_165D: {
    id: 'US_FDIC_165D',
    jurisdiction: 'US',
    regulator: 'FDIC',
    shortName: 'Resolution Plan',
    fullName: 'Section 165(d) Resolution Plan',
    description:
      'Joint FDIC/FRB resolution planning submission for bank holding companies with ≥ $250B in assets.',
    frequency: 'annual',
  },

  // ============================================================
  // OCC — expanded
  // ============================================================
  US_OCC_FAIR_ACCESS: {
    id: 'US_OCC_FAIR_ACCESS',
    jurisdiction: 'US',
    regulator: 'OCC',
    shortName: 'Fair Access',
    fullName: 'Fair Access to Financial Services Attestation',
    description:
      'OCC-required attestation for national banks demonstrating non-discriminatory service delivery.',
    frequency: 'annual',
  },

  // ============================================================
  // UK — PRA / FCA expanded
  // ============================================================
  UK_PRA_SS25_15: {
    id: 'UK_PRA_SS25_15',
    jurisdiction: 'UK',
    regulator: 'PRA',
    shortName: 'SS25/15 NSTs',
    fullName: 'PRA Supervisory Statement 25/15 — National Specific Templates',
    description:
      'UK-specific Solvency II national-specific templates for PRA-authorised insurers.',
    frequency: 'quarterly',
  },
  UK_PRA_SMCR: {
    id: 'UK_PRA_SMCR',
    jurisdiction: 'UK',
    regulator: 'PRA',
    shortName: 'SMCR returns',
    fullName: 'Senior Managers & Certification Regime filings',
    description:
      'Annual SMCR conduct certification + notifications for certified persons at PRA-designated senior management functions.',
    frequency: 'annual',
  },
  UK_FCA_REGDATA: {
    id: 'UK_FCA_REGDATA',
    jurisdiction: 'UK',
    regulator: 'FCA',
    shortName: 'RegData',
    fullName: 'FCA RegData Periodic Returns',
    description:
      'Ongoing prudential and conduct returns filed through the FCA RegData platform — replaced GABRIEL in 2021.',
    frequency: 'quarterly',
  },
  UK_FCA_CASS: {
    id: 'UK_FCA_CASS',
    jurisdiction: 'UK',
    regulator: 'FCA',
    shortName: 'CASS Resolution',
    fullName: 'CASS Resolution Pack',
    description:
      'Client assets safeguarding documentation required of any CASS-designated firm holding client money/securities.',
    frequency: 'annual',
  },

  // ============================================================
  // EU — Central Bank of Ireland (CBI)
  // ============================================================
  EU_CBI_PCF: {
    id: 'EU_CBI_PCF',
    jurisdiction: 'EU',
    regulator: 'CBI',
    shortName: 'F&P PCF',
    fullName: 'Fitness & Probity — Pre-Approval Controlled Function notifications',
    description:
      'CBI approval required for individuals taking up Pre-Approval Controlled Functions at regulated Irish financial firms.',
    frequency: 'event_driven',
    referenceUrl: 'https://www.centralbank.ie/',
  },
  EU_CBI_PRISM: {
    id: 'EU_CBI_PRISM',
    jurisdiction: 'EU',
    regulator: 'CBI',
    shortName: 'PRISM returns',
    fullName: 'Probability Risk and Impact SysteM supervisory returns',
    description:
      'Risk-based supervisory reporting under the CBI PRISM framework — frequency depends on impact tier (High / Medium-High / Medium-Low / Low).',
    frequency: 'quarterly',
  },
  EU_CBI_ICPG: {
    id: 'EU_CBI_ICPG',
    jurisdiction: 'EU',
    regulator: 'CBI',
    shortName: 'ICPG',
    fullName: 'Irish Corporate Governance Requirements Annual Report',
    description:
      'Annual corporate governance compliance statement for banks and insurers under CBI Corporate Governance Requirements.',
    frequency: 'annual',
  },
  EU_CBI_MICA_CASP: {
    id: 'EU_CBI_MICA_CASP',
    jurisdiction: 'EU',
    regulator: 'CBI',
    shortName: 'MiCA CASP (Ireland)',
    fullName: 'MiCA CASP Authorisation + Ongoing Returns — CBI',
    description:
      'CBI is the Irish NCA for Markets in Crypto-Assets authorisations; ongoing capital, safeguarding + disclosure returns apply.',
    frequency: 'quarterly',
  },

  // ============================================================
  // EU — ACPR (France)
  // ============================================================
  EU_ACPR_SURFI: {
    id: 'EU_ACPR_SURFI',
    jurisdiction: 'EU',
    regulator: 'ACPR',
    shortName: 'SURFI',
    fullName: 'Système Unifié de Reporting Financier',
    description:
      'Monthly / quarterly French prudential statistical reporting for ACPR-supervised banks, complementing COREP / FINREP.',
    frequency: 'monthly',
    referenceUrl: 'https://acpr.banque-france.fr/',
  },
  EU_ACPR_RUBA: {
    id: 'EU_ACPR_RUBA',
    jurisdiction: 'EU',
    regulator: 'ACPR',
    shortName: 'RUBA',
    fullName: 'Reporting Unifié des Banques et Assimilés',
    description:
      'Granular monthly balance-sheet return introduced in 2022, replacing SURFI balance-sheet tables for ACPR banks.',
    frequency: 'monthly',
  },
  EU_ACPR_RESOLUTION: {
    id: 'EU_ACPR_RESOLUTION',
    jurisdiction: 'EU',
    regulator: 'ACPR',
    shortName: 'Resolution Plan (FR)',
    fullName: 'Plan préventif de rétablissement + résolution',
    description:
      'Annual recovery & resolution planning submission to ACPR for French credit institutions.',
    frequency: 'annual',
  },

  // ============================================================
  // EU — AMF (France) — market regulator
  // ============================================================
  EU_AMF_RAI: {
    id: 'EU_AMF_RAI',
    jurisdiction: 'EU',
    regulator: 'AMF',
    shortName: 'AMF RAI',
    fullName: 'Rapport Annuel d\'Information — AMF',
    description:
      'Annual information document filed by French-listed issuers and certain asset managers with the AMF.',
    frequency: 'annual',
    referenceUrl: 'https://www.amf-france.org/',
  },
  EU_AMF_POSITION_REPORTING: {
    id: 'EU_AMF_POSITION_REPORTING',
    jurisdiction: 'EU',
    regulator: 'AMF',
    shortName: 'AMF Position Reporting',
    fullName: 'Daily position reporting on regulated markets',
    description:
      'Daily position limit + reporting obligations for persons trading commodity derivatives on French venues under MiFID II Article 58.',
    frequency: 'daily',
  },
};
