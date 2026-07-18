// src/devtools/__tests__/scenarios.test.ts
// Verifies all 11 named scenarios required by the task exist with a consistent, well-formed shape.

import { SCENARIOS, SCENARIO_LIST, ScenarioId } from '../scenarios';

const REQUIRED_SCENARIO_IDS: ScenarioId[] = [
  'default',
  'loading',
  'empty',
  'error',
  'loggedOut',
  'loggedIn',
  'setupIncomplete',
  'premium',
  'freeWithAds',
  'legacyProgress',
  'progressByLevel',
];

describe('devtools scenarios', () => {
  it('defines exactly the 11 required named scenarios', () => {
    expect(Object.keys(SCENARIOS).sort()).toEqual([...REQUIRED_SCENARIO_IDS].sort());
    expect(SCENARIO_LIST).toHaveLength(REQUIRED_SCENARIO_IDS.length);
  });

  it.each(REQUIRED_SCENARIO_IDS)(
    'scenario "%s" has a label, description and consistent id',
    (id) => {
      const scenario = SCENARIOS[id];
      expect(scenario.id).toBe(id);
      expect(scenario.label.length).toBeGreaterThan(0);
      expect(scenario.description.length).toBeGreaterThan(0);
    },
  );

  it('loggedOut scenario has a null user', () => {
    expect(SCENARIOS.loggedOut.auth.user).toBeNull();
  });

  it('premium scenario has isAdFree=true, freeWithAds has isAdFree=false', () => {
    expect(SCENARIOS.premium.monetization.isAdFree).toBe(true);
    expect(SCENARIOS.freeWithAds.monetization.isAdFree).toBe(false);
  });

  it('legacyProgress scenario uses the legacy shape; progressByLevel uses the v2 shape', () => {
    expect(SCENARIOS.legacyProgress.progress.shape).toBe('legacy');
    expect(SCENARIOS.progressByLevel.progress.shape).toBe('progressByLevel');
    expect(SCENARIOS.progressByLevel.progress.byLevel).toBeDefined();
  });

  it('error scenario carries a simulated error', () => {
    expect(SCENARIOS.error.simulatedError).toBeInstanceOf(Error);
  });

  it('loading scenario has isLoading=true for both auth and monetization', () => {
    expect(SCENARIOS.loading.auth.isLoading).toBe(true);
    expect(SCENARIOS.loading.monetization.isLoading).toBe(true);
  });
});
