// src/devtools/__tests__/screenRegistry.test.ts
// Registry smoke test: no duplicate ids, every entry has a real component reference, and the
// registry only references real, existing screens (imported, not re-implemented).
//
// Real screen modules are mocked (same convention as
// src/app/navigation/__tests__/RootNavigator.test.tsx) so this unit test never transitively loads
// `context/AuthContext.tsx` -> `firebase/auth` (ESM build unparsable by the current Jest
// transformIgnorePatterns outside of jest-expo's own transform scope). This test only verifies
// registry SHAPE (ids/labels/component refs), not real screen rendering.

jest.mock('../../../screens/OnboardingScreen', () => () => null);
jest.mock('../../../screens/AuthScreens', () => ({ LoginScreen: () => null, SignUpScreen: () => null }));
jest.mock('../../../screens/SetupScreens', () => ({ SetupScreen: () => null }));
jest.mock('../../../screens/HomeScreen', () => () => null);
jest.mock('../../../screens/SettingsScreen', () => () => null);
jest.mock('../../../screens/FavoritesScreen', () => () => null);
jest.mock('../../../screens/ExampleSentencesScreen', () => () => null);
jest.mock('../../../screens/LevelTestScreen', () => () => null);
jest.mock('../../../screens/ForgotPasswordScreen', () => () => null);

import { SCREEN_REGISTRY, assertNoDuplicateScreenIds, ScreenRegistryEntry } from '../screenRegistry';

describe('screenRegistry', () => {
  it('has no duplicate ids', () => {
    expect(() => assertNoDuplicateScreenIds()).not.toThrow();
  });

  it('throws when given a list with duplicate ids (guards the checker itself)', () => {
    const withDuplicate: ScreenRegistryEntry[] = [
      { id: 'A', label: 'A', component: () => null },
      { id: 'A', label: 'A again', component: () => null },
    ];
    expect(() => assertNoDuplicateScreenIds(withDuplicate)).toThrow(/Duplicate screenRegistry id/);
  });

  it('every entry has a non-empty id and label', () => {
    for (const entry of SCREEN_REGISTRY) {
      expect(entry.id.length).toBeGreaterThan(0);
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it('every entry has a defined component reference', () => {
    for (const entry of SCREEN_REGISTRY) {
      expect(entry.component).toBeDefined();
      expect(['function', 'object']).toContain(typeof entry.component);
    }
  });

  it('contains the expected real production screens (spot check)', () => {
    const ids = SCREEN_REGISTRY.map(e => e.id);
    expect(ids).toEqual(
      expect.arrayContaining(['Onboarding', 'Login', 'SignUp', 'Home', 'Settings', 'Favorites'])
    );
  });

  it('registry size matches the number of unique ids (no accidental duplicates via arrayContaining check)', () => {
    const ids = SCREEN_REGISTRY.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
