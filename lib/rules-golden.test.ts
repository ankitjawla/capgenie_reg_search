// Golden-fixture tests for the rules engine.
//
// For each well-known bank profile, we snapshot the sorted list of report
// IDs that `applyRules()` produces. If someone tweaks a rule or threshold
// in a way that changes the output for any of these banks, the snapshot
// mismatch flags it immediately.
//
// Updating a snapshot is explicit: re-run with `vitest --update`. That
// forces a human to acknowledge the regression and commit the new
// baseline — silent behavior drift is impossible.

import { describe, it, expect } from 'vitest';
import { applyRules } from './rules';
import { GOLDEN_PROFILES } from './rules-fixtures/profiles';

describe('golden fixtures', () => {
  for (const { name, profile } of GOLDEN_PROFILES) {
    it(`produces stable rules output for ${name}`, () => {
      const reports = applyRules(profile);
      const snapshot = {
        bank: name,
        reportCount: reports.length,
        // Sort for determinism — snapshot by id list, not full object,
        // so description / applicabilityReason text drift doesn't flap.
        reportIds: reports.map((r) => r.id).sort(),
        byJurisdiction: reports.reduce<Record<string, number>>((acc, r) => {
          acc[r.jurisdiction] = (acc[r.jurisdiction] ?? 0) + 1;
          return acc;
        }, {}),
      };
      expect(snapshot).toMatchSnapshot();
    });
  }
});
