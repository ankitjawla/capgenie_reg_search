// "LEI-lite" — pragmatic text-normalization for the cache key.
//
// The review flagged that `"JPM"`, `"JP Morgan"`, `"JPMorgan Chase"`, and
// `"JPMorgan Chase & Co."` all miss each other in the cache because we
// keyed on raw lowercased text. A full fix requires a GLEIF LEI lookup;
// that's still deferred (see docs/DEFERRED.md). What we ship now is the
// 80/20 version:
//
//  1. lowercase
//  2. strip common corporate suffixes (Inc, Ltd, PLC, LLC, S.A., GmbH,
//     N.V., AG, Limited, Corporation, etc.)
//  3. collapse whitespace + ampersands to a single space
//  4. drop punctuation that doesn't carry meaning (. , &)
//
// So `"JPMorgan Chase & Co."`, `"JPMorgan Chase"`, and `"JPMorgan Chase Co"`
// all normalize to `"jpmorgan chase"`. Still won't catch `"JPM"` (a
// genuine alias), but it kills the biggest class of near-duplicate misses.
//
// Full GLEIF canonicalization is tracked in docs/DEFERRED.md.

const CORPORATE_SUFFIXES = [
  // English
  'incorporated',
  'inc',
  'limited',
  'ltd',
  'llc',
  'l.l.c',
  'plc',
  'p.l.c',
  'corporation',
  'corp',
  'company',
  'co',
  'holdings',
  'group',
  'bank',
  'banking corporation',
  'banking',
  // European
  's.a',
  'sa',
  'n.v',
  'nv',
  'a.g',
  'ag',
  'gmbh',
  'kg',
  'kgaa',
  's.p.a',
  'spa',
  's.l',
  'sl',
  'oy',
  'ab',
  // Asia
  'limited (hong kong)',
  'limited (singapore)',
  // Russian / other
  'pao',
  'oao',
];

// Sort descending by length so "banking corporation" matches before "bank".
const SUFFIX_REGEX_PARTS = CORPORATE_SUFFIXES.sort((a, b) => b.length - a.length).map((s) =>
  s.replace(/[.\\^$*+?()[\]{}|]/g, '\\$&'),
);
const SUFFIX_REGEX = new RegExp(
  `\\b(${SUFFIX_REGEX_PARTS.join('|')})\\b\\.?`,
  'gi',
);

export function canonicalName(raw: string): string {
  if (!raw) return '';
  let s = raw.trim().toLowerCase();
  // Collapse the & into " and " temporarily so "J.P. Morgan & Co." becomes
  // consistent with "J.P. Morgan and Co.", then normalize the other way.
  s = s.replace(/&/g, ' and ');
  // Repeatedly strip corporate suffixes from the end.
  let prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(SUFFIX_REGEX, ' ').replace(/\s+/g, ' ').trim();
  }
  // Drop trailing " and" left over from "& Co." removal.
  s = s.replace(/\s+and\s*$/g, '').trim();
  // Kill remaining punctuation.
  s = s.replace(/[.,'"`]/g, '').replace(/\s+/g, ' ').trim();
  return s;
}
