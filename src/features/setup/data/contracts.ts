// src/features/setup/data/contracts.ts
// Layer: data (contracts) | Feature: setup. Interface only — PREP (docs/refactor-v2/13, /35 §7).
// Encapsulates the persistence that SetupScreens currently does with a DIRECT
// setDoc(users/{uid}, { setupCompleted: true, preferences }) — to be implemented by delegating to the
// local stores + UserProfileRepository (no direct Firestore) in a later, device-QA'd wiring step.

import type { UserPreferences } from '../domain/types';

export interface SetupPreferencesWriter {
  /** Persist preferences locally (@native_language/@target_language/@user_level) AND mark setup complete remotely. */
  saveSetupPreferences(userId: string, prefs: UserPreferences): Promise<void>;
}
