import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@shared/storage';

import type { LevelTestPreferencesRepository } from '../application/levelTestContracts';

export class AsyncStorageLevelTestPreferencesRepository implements LevelTestPreferencesRepository {
  async getStoredLanguages() {
    const [nativeLanguage, targetLanguage] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.NATIVE_LANGUAGE),
      AsyncStorage.getItem(STORAGE_KEYS.TARGET_LANGUAGE),
    ]);
    return nativeLanguage && targetLanguage ? { nativeLanguage, targetLanguage } : null;
  }
}
