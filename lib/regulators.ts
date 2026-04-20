// Canonical registry of regulators that appear in the catalog. Each entry
// is the static metadata; bios may be overridden at runtime by
// `lib/regulators-bios.json` (generated during the build step when Azure
// env vars are available).

import type { Jurisdiction } from './types';

export interface RegulatorMeta {
  slug: string;
  name: string;
  jurisdictions: Jurisdiction[];
  shortBio: string;
  website: string;
  emoji: string; // simple text emblem
  // Catalog strings that canonicalize to this slug. The pivot matches the
  // CatalogEntry.regulator field against this list with a case-insensitive
  // `includes` check.
  matchers: string[];
}

export const REGULATORS: RegulatorMeta[] = [
  // ==================== UNITED STATES ====================
  {
    slug: 'ffiec',
    name: 'FFIEC',
    jurisdictions: ['US'],
    shortBio:
      'The Federal Financial Institutions Examination Council coordinates the US banking regulators\' examination standards, most prominently the Call Report family (FFIEC 031 / 041 / 051).',
    website: 'https://www.ffiec.gov/',
    emoji: '🏛',
    matchers: ['ffiec'],
  },
  {
    slug: 'federal-reserve',
    name: 'Federal Reserve',
    jurisdictions: ['US'],
    shortBio:
      'The Fed supervises bank holding companies and issues the FR Y forms (Y-9C, Y-14, Y-15, FR 2052a) that drive US systemic-risk and stress-testing reporting.',
    website: 'https://www.federalreserve.gov/',
    emoji: '🏦',
    matchers: ['federal reserve', 'frb'],
  },
  {
    slug: 'fdic',
    name: 'FDIC',
    jurisdictions: ['US'],
    shortBio:
      'The Federal Deposit Insurance Corporation insures US deposit-taking banks and publishes Statistics on Depository Institutions; jointly handles Call Reports and Section 165(d) resolution plans.',
    website: 'https://www.fdic.gov/',
    emoji: '🏦',
    matchers: ['fdic'],
  },
  {
    slug: 'occ',
    name: 'OCC',
    jurisdictions: ['US'],
    shortBio:
      'The Office of the Comptroller of the Currency charters national banks and federal savings associations, overseeing safety-and-soundness for ~1,000 US institutions.',
    website: 'https://www.occ.gov/',
    emoji: '🏛',
    matchers: ['occ'],
  },
  {
    slug: 'cfpb',
    name: 'CFPB',
    jurisdictions: ['US'],
    shortBio:
      'The Consumer Financial Protection Bureau enforces federal consumer financial law; HMDA and CRA data collection fall under its remit.',
    website: 'https://www.consumerfinance.gov/',
    emoji: '👥',
    matchers: ['cfpb'],
  },
  {
    slug: 'sec',
    name: 'SEC',
    jurisdictions: ['US'],
    shortBio:
      'The Securities and Exchange Commission regulates US public markets — receives 10-K / 10-Q / 8-K from listed companies, 13F from institutional managers, and Form ADV from investment advisers.',
    website: 'https://www.sec.gov/',
    emoji: '📈',
    matchers: ['sec'],
  },
  {
    slug: 'fincen',
    name: 'FinCEN',
    jurisdictions: ['US'],
    shortBio:
      'The Financial Crimes Enforcement Network administers the Bank Secrecy Act — recipient of SARs, CTRs, and MSB / crypto-firm BSA filings.',
    website: 'https://www.fincen.gov/',
    emoji: '🔎',
    matchers: ['fincen'],
  },
  {
    slug: 'nydfs',
    name: 'NYDFS',
    jurisdictions: ['US'],
    shortBio:
      'The New York Department of Financial Services issues the BitLicense (23 NYCRR Part 200) and supervises New York-chartered banks and insurers.',
    website: 'https://www.dfs.ny.gov/',
    emoji: '🗽',
    matchers: ['nydfs'],
  },
  {
    slug: 'naic',
    name: 'NAIC',
    jurisdictions: ['US'],
    shortBio:
      'The National Association of Insurance Commissioners maintains the US statutory accounting framework and receives the Annual Statement + ORSA from state-licensed insurers.',
    website: 'https://www.naic.org/',
    emoji: '🛡',
    matchers: ['naic'],
  },
  {
    slug: 'treasury',
    name: 'U.S. Treasury',
    jurisdictions: ['US'],
    shortBio:
      'Treasury receives Treasury International Capital (TIC) banking forms covering cross-border claims and liabilities.',
    website: 'https://home.treasury.gov/',
    emoji: '🏛',
    matchers: ['treasury'],
  },

  // ==================== UNITED KINGDOM ====================
  {
    slug: 'pra',
    name: 'PRA',
    jurisdictions: ['UK'],
    shortBio:
      'The Prudential Regulation Authority is part of the Bank of England and supervises UK banks, building societies, and insurers — owner of PRA110, FSA047/048, SS25/15 NSTs.',
    website: 'https://www.bankofengland.co.uk/prudential-regulation',
    emoji: '🏛',
    matchers: ['pra'],
  },
  {
    slug: 'fca',
    name: 'FCA',
    jurisdictions: ['UK'],
    shortBio:
      'The Financial Conduct Authority regulates ~50,000 firms for conduct and market-integrity, runs RegData, MLAR, CASS resolution pack, and SMCR.',
    website: 'https://www.fca.org.uk/',
    emoji: '⚖️',
    matchers: ['fca'],
  },

  // ==================== EUROPEAN UNION ====================
  {
    slug: 'eba',
    name: 'EBA',
    jurisdictions: ['EU'],
    shortBio:
      'The European Banking Authority sets binding standards for EU prudential reporting — custodian of COREP, FINREP, ALMM, and MiCA ART/EMT whitepaper requirements.',
    website: 'https://www.eba.europa.eu/',
    emoji: '🇪🇺',
    matchers: ['eba'],
  },
  {
    slug: 'eiopa',
    name: 'EIOPA',
    jurisdictions: ['EU'],
    shortBio:
      'The European Insurance and Occupational Pensions Authority issues the Solvency II framework — QRTs, SFCR / RSR, ORSA.',
    website: 'https://www.eiopa.europa.eu/',
    emoji: '🛡',
    matchers: ['eiopa'],
  },
  {
    slug: 'esma',
    name: 'ESMA',
    jurisdictions: ['EU'],
    shortBio:
      'The European Securities and Markets Authority oversees market-integrity rules across the EU — MiFIR transaction reporting, MiCA Level 2/3, credit-rating agency supervision.',
    website: 'https://www.esma.europa.eu/',
    emoji: '📊',
    matchers: ['esma'],
  },
  {
    slug: 'ecb',
    name: 'ECB',
    jurisdictions: ['EU'],
    shortBio:
      'The European Central Bank directly supervises ~110 significant institutions in the Single Supervisory Mechanism and sets euro-area monetary policy.',
    website: 'https://www.ecb.europa.eu/',
    emoji: '🇪🇺',
    matchers: ['ecb'],
  },
  {
    slug: 'cbi',
    name: 'Central Bank of Ireland',
    jurisdictions: ['EU'],
    shortBio:
      'The CBI supervises Irish banks, insurers, fund managers, and crypto-asset service providers — runs the PRISM impact-tier framework and the Fitness & Probity regime.',
    website: 'https://www.centralbank.ie/',
    emoji: '🇮🇪',
    matchers: ['cbi'],
  },
  {
    slug: 'acpr',
    name: 'ACPR',
    jurisdictions: ['EU'],
    shortBio:
      'L\'Autorité de contrôle prudentiel et de résolution supervises French banks and insurers, runs the SURFI + RUBA reporting frameworks, and is the French SSM NCA.',
    website: 'https://acpr.banque-france.fr/',
    emoji: '🇫🇷',
    matchers: ['acpr'],
  },
  {
    slug: 'amf',
    name: 'AMF',
    jurisdictions: ['EU'],
    shortBio:
      'L\'Autorité des marchés financiers is the French securities regulator — oversees Euronext Paris issuers, asset managers, and commodity-derivatives position reporting.',
    website: 'https://www.amf-france.org/',
    emoji: '🇫🇷',
    matchers: ['amf'],
  },
  {
    slug: 'ncas',
    name: 'National Competent Authorities',
    jurisdictions: ['EU'],
    shortBio:
      'Across the EU, national competent authorities (e.g. BaFin, Banco de España, Banca d\'Italia) implement EU-level frameworks through their national reporting channels.',
    website: 'https://www.eba.europa.eu/',
    emoji: '🇪🇺',
    matchers: ['national competent authority', 'nca'],
  },

  // ==================== INDIA ====================
  {
    slug: 'rbi',
    name: 'RBI',
    jurisdictions: ['IN'],
    shortBio:
      'The Reserve Bank of India is the central bank + banking supervisor — receives DSB Returns, Form A/VIII/X, BSR-1/2, CRILC, and the full Basel-III framework in India.',
    website: 'https://www.rbi.org.in/',
    emoji: '🇮🇳',
    matchers: ['rbi'],
  },
  {
    slug: 'irdai',
    name: 'IRDAI',
    jurisdictions: ['IN'],
    shortBio:
      'The Insurance Regulatory and Development Authority of India supervises Indian insurers — quarterly + annual public disclosures (Investment, Solvency, Claims Paid).',
    website: 'https://www.irdai.gov.in/',
    emoji: '🛡',
    matchers: ['irdai'],
  },
  {
    slug: 'fiu-ind',
    name: 'FIU-IND',
    jurisdictions: ['IN'],
    shortBio:
      'The Financial Intelligence Unit — India receives PMLA reports: CTR, STR, NTR, CCR filings from banks and other reporting entities.',
    website: 'https://fiuindia.gov.in/',
    emoji: '🔎',
    matchers: ['fiu-ind'],
  },
  {
    slug: 'sebi',
    name: 'SEBI',
    jurisdictions: ['IN'],
    shortBio:
      'The Securities and Exchange Board of India regulates Indian securities markets — receives listed-entity disclosures, fund-manager registrations, and AIF/PMS reports.',
    website: 'https://www.sebi.gov.in/',
    emoji: '📊',
    matchers: ['sebi'],
  },

  // ==================== CANADA ====================
  {
    slug: 'osfi',
    name: 'OSFI',
    jurisdictions: ['CA'],
    shortBio:
      'The Office of the Superintendent of Financial Institutions supervises federally regulated Canadian banks and insurers — CAR, A1/A2 returns, LCR/NSFR, LRR.',
    website: 'https://www.osfi-bsif.gc.ca/',
    emoji: '🇨🇦',
    matchers: ['osfi'],
  },
  {
    slug: 'fintrac',
    name: 'FINTRAC',
    jurisdictions: ['CA'],
    shortBio:
      'The Financial Transactions and Reports Analysis Centre of Canada receives LCTR + STR filings under the PCMLTFA.',
    website: 'https://fintrac-canafe.canada.ca/',
    emoji: '🔎',
    matchers: ['fintrac'],
  },

  // ==================== SINGAPORE ====================
  {
    slug: 'mas',
    name: 'MAS',
    jurisdictions: ['SG'],
    shortBio:
      'The Monetary Authority of Singapore is the central bank + integrated financial regulator — Notice 610/637/649/757 reporting.',
    website: 'https://www.mas.gov.sg/',
    emoji: '🇸🇬',
    matchers: ['mas'],
  },
  {
    slug: 'stro',
    name: 'STRO / CAD',
    jurisdictions: ['SG'],
    shortBio:
      'The Suspicious Transaction Reporting Office at Singapore\'s Commercial Affairs Department receives STRs under the Corruption, Drug Trafficking and Other Serious Crimes Act.',
    website: 'https://www.police.gov.sg/',
    emoji: '🔎',
    matchers: ['stro'],
  },

  // ==================== HONG KONG ====================
  {
    slug: 'hkma',
    name: 'HKMA',
    jurisdictions: ['HK'],
    shortBio:
      'The Hong Kong Monetary Authority supervises authorized institutions in HK — MA(BS)1, CAR, LMR/LCR, Banking Disclosure Statement.',
    website: 'https://www.hkma.gov.hk/',
    emoji: '🇭🇰',
    matchers: ['hkma'],
  },
  {
    slug: 'jfiu',
    name: 'JFIU',
    jurisdictions: ['HK'],
    shortBio:
      'The Joint Financial Intelligence Unit in Hong Kong receives STRs under the Organized and Serious Crimes Ordinance.',
    website: 'https://www.jfiu.gov.hk/',
    emoji: '🔎',
    matchers: ['jfiu'],
  },
];

// Optional build-time-generated bios. `lib/regulators-bios.json` starts
// empty ({}) and is rewritten by `npm run build:bios`. When a slug is
// absent we fall back to the hardcoded `shortBio` below.
import biosOverrides from './regulators-bios.json';

const BIO_OVERRIDES = biosOverrides as Record<string, string>;

export function findRegulatorBySlug(slug: string): RegulatorMeta | undefined {
  const base = REGULATORS.find((r) => r.slug === slug);
  if (!base) return undefined;
  const override = BIO_OVERRIDES[slug];
  return override ? { ...base, shortBio: override } : base;
}

export function regulatorBio(slug: string): string {
  return BIO_OVERRIDES[slug] ?? REGULATORS.find((r) => r.slug === slug)?.shortBio ?? '';
}
