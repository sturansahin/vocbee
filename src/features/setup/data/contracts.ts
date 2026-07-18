// src/features/setup/data/contracts.ts
// Layer: data (contracts) | Feature: setup. Compatibility use-case port retained for callers that
// only need preference persistence. The production SetupFacade uses SetupPlatformGateway and
// delegates users/{uid} completion writes to UserProfileRepository.

import type { UserPreferences } from '../domain/types';

export interface SetupPreferencesWriter {
  /** Persist preferences locally (@native_language/@target_language/@user_level) AND mark setup complete remotely. */
  saveSetupPreferences(userId: string, prefs: UserPreferences): Promise<void>;
}
