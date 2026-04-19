import { describe, it, expect } from 'vitest';
import { reportsToCsv, csvFilename } from './export';
import type { ReportRecommendation } from './types';

const sample: ReportRecommendation[] = [
  {
    id: 'US_FFIEC_031',
    jurisdiction: 'US',
    regulator: 'FFIEC',
    shortName: 'FFIEC 031',
    fullName: 'Consolidated Report of Condition and Income',
    description: 'Quarterly Call Report for banks with foreign offices.',
    frequency: 'quarterly',
    applicabilityReason: 'Large bank with global footprint.',
    referenceUrl: 'https://example.com',
    confidence: 'high',
    evidenceFieldIds: ['presence.US'],
  },
  {
    id: 'US_HMDA_LAR',
    jurisdiction: 'US',
    regulator: 'CFPB',
    shortName: 'HMDA LAR',
    fullName: 'Home Mortgage Disclosure Act Loan/Application Register',
    description: 'Residential mortgage reporting.',
    frequency: 'annual',
    applicabilityReason: 'Mortgage origination volume above threshold, including commas, "quotes", and\nnewlines.',
    confidence: 'medium',
    evidenceFieldIds: ['presence.US', 'activities.mortgage_lending'],
  },
];

describe('reportsToCsv', () => {
  it('writes a header row and escapes cells containing commas, quotes, and newlines', () => {
    const csv = reportsToCsv(sample);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe(
      'Jurisdiction,Regulator,Short name,Full name,Frequency,Confidence,Applicability,Description,Reference URL',
    );
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('FFIEC 031');
    expect(lines[2]).toContain(
      '"Mortgage origination volume above threshold, including commas, ""quotes"", and\nnewlines."',
    );
  });

  it('emits an empty reference URL cell when referenceUrl is missing', () => {
    const csv = reportsToCsv(sample);
    const row2 = csv.split('\r\n')[2];
    expect(row2.endsWith(',')).toBe(true);
  });
});

describe('csvFilename', () => {
  it('slugs the bank name and includes an ISO date', () => {
    const name = csvFilename('JPMorgan Chase & Co.');
    expect(name.startsWith('capgenie-jpmorgan-chase-co-')).toBe(true);
    expect(name.endsWith('.csv')).toBe(true);
    expect(name).toMatch(/\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('falls back to "report" for a pathological bank name', () => {
    expect(csvFilename('!!!')).toMatch(/^capgenie-report-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
