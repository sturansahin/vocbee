// src/features/settings/data/contracts.ts
// Layer: data (contracts) | Feature: settings. Interface only (docs/refactor-v2/35 §7).
// Local-first; setup's remote preference write is delegated to UserProfileRepository.

import type { UserPreferences } from '@features/setup';

export interface SettingsRepository {
  getPreferences(): Promise<UserPreferences | null>;                       // local-first
  savePreferences(userId: string, prefs: UserPreferences): Promise<void>;  // local + profile-repo delegation
  getAppLanguage(): Promise<string>;                                       // @user_language
  setAppLanguage(lang: string): Promise<void>;                            // i18n + RTL (utils/rtl.ts) in wiring
  getUserLevel(): Promise<string | null>;
  setUserLevel(level: string): Promise<void>;
}
