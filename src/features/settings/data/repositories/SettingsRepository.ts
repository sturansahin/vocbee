// src/features/settings/data/repositories/SettingsRepository.ts
// Layer: data (repository impl) | Feature: settings.
//
// Wired by settings composition for the SAME local keys used by legacy Settings/Setup
// (@native_language/@target_language/@user_level/@user_language). Setup completion's remote merge is
// delegated separately to UserProfileRepository, so this repository remains SDK-local and has no
// Firestore dependency.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@shared/storage';
import type { UserPreferences } from '@features/setup';
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

  getUserLevel(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.USER_LEVEL);
  }

  async setUserLevel(level: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_LEVEL, level);
  }
}
