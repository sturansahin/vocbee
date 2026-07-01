// src/features/settings/data/repositories/SettingsRepository.ts
// Layer: data (repository impl) | Feature: settings.
//
// ⚠️ PREP / NOT WIRED (Phase 7, docs/refactor-v2/27, /35 §7): not imported by running code, not exported
//    from the barrel (docs/refactor-v2/33 §4). Reads/writes the SAME local keys SettingsScreen/SetupScreens
//    use today (@native_language/@target_language/@user_level/@user_language). Remote preference + setupCompleted
//    persistence is delegated to UserProfileRepository in a later wiring step (replaces the stale direct
//    setDoc) — kept local-only here so this file has NO Firestore dependency.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@shared/storage';
import type { UserPreferences } from '../../../setup/domain/types';
import type { SettingsRepository } from '../contracts';

export class LocalSettingsRepository implements SettingsRepository {
  async getPreferences(): Promise<UserPreferences | null> {
    const [nativeLanguage, targetLanguage, level] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.NATIVE_LANGUAGE),
      AsyncStorage.getItem(STORAGE_KEYS.TARGET_LANGUAGE),
      AsyncStorage.getItem(STORAGE_KEYS.USER_LEVEL),
    ]);
    if (nativeLanguage && targetLanguage && level) {
      return { nativeLanguage, targetLanguage, level };
    }
    return null;
  }

  async savePreferences(_userId: string, prefs: UserPreferences): Promise<void> {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.NATIVE_LANGUAGE, prefs.nativeLanguage],
      [STORAGE_KEYS.TARGET_LANGUAGE, prefs.targetLanguage],
      [STORAGE_KEYS.USER_LEVEL, prefs.level],
    ]);
    // Remote (users/{uid}.preferences + setupCompleted) -> UserProfileRepository in the wiring step.
  }

  async getAppLanguage(): Promise<string> {
    return (await AsyncStorage.getItem(STORAGE_KEYS.USER_LANGUAGE)) ?? 'en';
  }

  async setAppLanguage(lang: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_LANGUAGE, lang);
  }
}
