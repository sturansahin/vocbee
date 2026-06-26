// src/features/settings/data/contracts.ts
// Layer: data (contracts) | Feature: settings. Interface only (docs/refactor-v2/35 §7).
// Local-first; remote preference writes are delegated to UserProfileRepository — NO direct Firestore.

import type { UserPreferences } from '../../setup/domain/types';

export interface SettingsRepository {
  getPreferences(): Promise<UserPreferences | null>;                       // local-first
  savePreferences(userId: string, prefs: UserPreferences): Promise<void>;  // local + profile-repo delegation
  getAppLanguage(): Promise<string>;                                       // @user_language
  setAppLanguage(lang: string): Promise<void>;                            // i18n + RTL (utils/rtl.ts) in wiring
}
