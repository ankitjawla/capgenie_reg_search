import { describe, it, expect } from 'vitest';
import { canonicalName } from './canonical-name';

describe('canonicalName', () => {
  it('collapses corporate suffixes so near-duplicates share a key', () => {
    const variants = [
      'JPMorgan Chase & Co.',
      'JPMorgan Chase',
      'JPMorgan Chase Co',
      'JPMorgan Chase & Co',
      'JPMorgan Chase Incorporated',
    ];
    const canonicals = new Set(variants.map(canonicalName));
    expect(canonicals.size).toBe(1);
    expect(canonicals.values().next().value).toBe('jpmorgan chase');
  });

  it('strips PLC / Limited suffixes', () => {
    expect(canonicalName('Barclays PLC')).toBe('barclays');
    expect(canonicalName('HDFC Bank Limited')).toBe('hdfc');
    expect(canonicalName('The Hongkong and Shanghai Banking Corporation Limited')).toBe(
      'the hongkong and shanghai',
    );
  });

  it('handles European corporate suffixes', () => {
    expect(canonicalName('Deutsche Bank AG')).toBe('deutsche');
    expect(canonicalName('BNP Paribas S.A.')).toBe('bnp paribas');
    expect(canonicalName('ING Groep N.V.')).toBe('ing groep');
  });

  it('returns empty string on blank input', () => {
    expect(canonicalName('')).toBe('');
    expect(canonicalName('   ')).toBe('');
  });
});
