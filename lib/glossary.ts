// Plain-English glossary of regulatory terms that appear throughout
// CapGenie. The entries here are intentionally short — point users to
// the primary regulator's own page for the canonical definition.

export interface GlossaryEntry {
  term: string;
  expansion?: string;
  body: string;
  category: 'Designation' | 'Concept' | 'Body' | 'Filing';
  links?: { label: string; href: string }[];
}

export const GLOSSARY: GlossaryEntry[] = [
  // Designations
  {
    term: 'G-SIB',
    expansion: 'Global Systemically Important Bank',
    category: 'Designation',
    body: 'A bank whose failure would have cascading effects across the global financial system. Designated annually by the Financial Stability Board based on size, interconnectedness, complexity, cross-jurisdictional activity, and substitutability. G-SIBs face higher capital surcharges and additional reporting (FR Y-15 in the US, CRR Part 7 in the EU).',
    links: [{ label: 'FSB G-SIB list', href: 'https://www.fsb.org/work-of-the-fsb/financial-innovation-and-structural-change/systemically-important-financial-institutions-sifis/' }],
  },
  {
    term: 'D-SIB',
    expansion: 'Domestic Systemically Important Bank',
    category: 'Designation',
    body: "A bank designated by its home regulator as systemic within that single jurisdiction. The criteria mirror G-SIB but are scoped to the home market. D-SIBs face higher domestic capital surcharges (RBI's bucketing in India, OSFI's in Canada).",
  },
  {
    term: 'FBO',
    expansion: 'Foreign Banking Organization',
    category: 'Designation',
    body: 'A non-US bank that operates in the United States through a branch, agency, or representative office (not a separately chartered US subsidiary). FBOs file the FFIEC 002 instead of the standard Call Report.',
  },
  {
    term: 'IHC',
    expansion: 'Intermediate Holding Company',
    category: 'Concept',
    body: 'A US holding company that a Foreign Banking Organization must form when its non-branch US assets exceed $50B. The IHC must hold all the FBO\'s US subsidiary banks and is subject to the same prudential standards as a US bank holding company.',
  },
  {
    term: 'FDIC insured',
    category: 'Designation',
    body: 'A US bank whose deposit accounts are guaranteed by the FDIC up to the statutory limit (currently $250,000). Triggers CRA data collection, FDIC-specific filings, and SDI reporting.',
    links: [{ label: 'FDIC BankFind', href: 'https://banks.data.fdic.gov/' }],
  },

  // Concepts
  {
    term: 'Tailoring rule',
    category: 'Concept',
    body: 'The 2019 US framework that segments large bank holding companies into Categories I-IV based on asset size, cross-jurisdictional activity, and short-term wholesale funding. The category controls which prudential and reporting standards apply (capital stress testing, LCR, NSFR, FR 2052a, FFIEC 009).',
  },
  {
    term: 'Tier-1 capital',
    category: 'Concept',
    body: 'A bank\'s core capital — common equity, retained earnings, and certain preferred shares. The Basel III framework requires banks to hold a minimum ratio of Tier-1 capital to risk-weighted assets, with surcharges layered on for G-SIBs and D-SIBs.',
  },
  {
    term: 'LCR',
    expansion: 'Liquidity Coverage Ratio',
    category: 'Concept',
    body: 'A Basel III liquidity standard requiring banks to hold high-quality liquid assets sufficient to cover 30 days of net cash outflows under stress. In the US it is reported via FR 2052a; in the EU via the COREP LCR templates (C 72-76).',
  },
  {
    term: 'NSFR',
    expansion: 'Net Stable Funding Ratio',
    category: 'Concept',
    body: "A Basel III complement to LCR that requires a one-year stable-funding-to-stable-asset ratio of ≥ 100%. Reported quarterly under each jurisdiction's prudential framework.",
  },
  {
    term: 'CRR / CRD',
    expansion: 'Capital Requirements Regulation / Directive',
    category: 'Concept',
    body: "The EU's implementation of the Basel III framework. CRR is the directly-applicable regulation (capital, liquidity, reporting), CRD is the directive that member states transpose into national law (supervisory powers, capital buffers).",
  },
  {
    term: 'Ring-fencing',
    category: 'Concept',
    body: 'A UK rule introduced after the 2008 crisis requiring banks with > £25B of mandated UK deposits to legally separate their retail and investment banking activities. The ring-fenced bank reports through a separate set of returns to the PRA.',
  },

  // Bodies
  {
    term: 'FFIEC',
    expansion: 'Federal Financial Institutions Examination Council',
    category: 'Body',
    body: 'A US interagency coordinator (FRB / FDIC / OCC / NCUA / CFPB) that publishes uniform reporting standards. FFIEC owns the Call Reports (031/041/051), country-exposure reporting (009), and the advanced-capital framework (101).',
    links: [{ label: 'FFIEC reports', href: 'https://www.ffiec.gov/forms.htm' }],
  },
  {
    term: 'FFIEC 031 / 041 / 051',
    category: 'Filing',
    body: 'The three flavors of the US Consolidated Report of Condition and Income ("Call Report"). 031 is for banks with both US and foreign offices; 041 is for US-only banks with ≥ $5B assets; 051 is the streamlined version for US-only banks with < $5B assets.',
  },
  {
    term: 'FR Y-9C',
    category: 'Filing',
    body: 'A quarterly consolidated financial statement filed by US bank holding companies, savings & loan holding companies, and FBO IHCs with ≥ $3B in consolidated assets. Filed to the Federal Reserve.',
  },
  {
    term: 'FR Y-14A / 14Q / 14M',
    category: 'Filing',
    body: 'The CCAR/DFAST stress-testing schedules for US bank holding companies with ≥ $100B in assets. The annual (14A), quarterly (14Q), and monthly (14M) variants cover capital assessment, portfolio data, and loan-level mortgage/credit-card data respectively.',
  },
  {
    term: 'COREP',
    expansion: 'Common Reporting Framework',
    category: 'Filing',
    body: 'The EU\'s harmonised prudential reporting framework for credit institutions. Covers own funds, capital adequacy, leverage ratio, large exposures, and liquidity (LCR/NSFR). Reported quarterly under EBA Implementing Technical Standards.',
  },
  {
    term: 'FINREP',
    expansion: 'Financial Reporting Framework',
    category: 'Filing',
    body: "The EU's harmonised financial-statement reporting framework. Mandatory for credit institutions reporting under IFRS and for others above national thresholds.",
  },
  {
    term: 'PRA110',
    category: 'Filing',
    body: 'The UK Prudential Regulation Authority\'s granular cash-flow mismatch return for PRA-authorised banks and building societies. Replaced the old FSA047/048 liquidity returns for the largest firms.',
  },
  {
    term: 'AnaCredit',
    category: 'Filing',
    body: 'An EU loan-level credit registry. Banks must report every loan to a legal entity ≥ €25,000 to the ECB / national central bank, with monthly granularity.',
  },
  {
    term: 'MiCA',
    expansion: 'Markets in Crypto-Assets',
    category: 'Concept',
    body: 'The EU regulation establishing a harmonised regime for crypto-asset issuers and service providers (CASPs). Authorization, conduct, and reporting requirements were phased in through 2024-25.',
  },
  {
    term: 'BitLicense',
    category: 'Filing',
    body: "New York's regulatory framework for crypto firms (23 NYCRR Part 200). Holders must file an annual financial statement and transaction-monitoring-program certification with the NYDFS.",
  },
  {
    term: 'Solvency II',
    category: 'Concept',
    body: 'The EU\'s harmonised prudential framework for insurance and reinsurance undertakings. Centered on the Solvency Capital Requirement (SCR) and the Minimum Capital Requirement (MCR), with quarterly QRTs and an annual SFCR.',
  },
  {
    term: 'NAIC',
    expansion: 'National Association of Insurance Commissioners',
    category: 'Body',
    body: 'A coordinating body for US state insurance regulators. Publishes uniform statutory accounting principles, model laws, and the annual statement blanks (Blue / Green / Yellow / Orange book by line of business).',
  },
];
