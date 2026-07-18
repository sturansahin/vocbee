// src/features/setup/application/useCases/completeSetup.ts
// Layer: application | Feature: setup. Depends only on the domain rule + the SetupPreferencesWriter port
// (DIP). This is the SDK-free, fake-testable core of "finish setup": it validates the preferences and
// delegates persistence — replacing the direct setDoc(users/{uid}, {setupCompleted:true,...}) inlined in
// screens/SetupScreens.tsx (docs/refactor-v2/13, /27 §9). Behavior preserved: same validity gate, same
// setupCompleted semantics.

import { canCompleteSetup } from '../../domain/rules';
import type { UserPreferences } from '../../domain/types';
import type { SetupPreferencesWriter } from '../../data/contracts';

export function makeCompleteSetup(writer: SetupPreferencesWriter) {
  return async function completeSetup(userId: string, prefs: UserPreferences): Promise<void> {
    if (!canCompleteSetup(prefs)) {
      throw new Error('Setup cannot be completed: invalid language/level preferences.');
    }
    await writer.saveSetupPreferences(userId, prefs);
  };
}
