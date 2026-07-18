import AsyncStorage from '@react-native-async-storage/async-storage';

import { markAsUnsynced, STORAGE_KEYS } from '@shared/storage';

import type { ProgressLocalStore } from '../../application/contracts';
import type { UserProgress } from '../../domain/types';

export class AsyncStorageProgressRepository implements ProgressLocalStore {
  async readProgress(): Promise<UserProgress> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS);
    return raw ? (JSON.parse(raw) as UserProgress) : {};
  }

  async writeProgress(progress: UserProgress): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
    await markAsUnsynced();
  }

  readCurrentLevel(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.CURRENT_LEVEL);
  }

  async writeCurrentLevel(level: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_LEVEL, level);
    await markAsUnsynced();
  }

  readLastWordId(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.LAST_WORD_ID);
  }

  async writeLastWordId(wordId: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_WORD_ID, String(wordId));
    await markAsUnsynced();
  }

  async clear(markUnsynced: boolean): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PROGRESS,
      STORAGE_KEYS.CURRENT_LEVEL,
      STORAGE_KEYS.LAST_WORD_ID,
    ]);
    if (markUnsynced) await markAsUnsynced();
  }

  async restore(
    progress: UserProgress | null,
    currentLevel: string | null,
    lastWordId?: number | null,
  ): Promise<void> {
    if (progress && typeof progress === 'object') {
      await AsyncStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
      console.log('Restored learned words from Firebase:', Object.keys(progress).length, 'levels');
    }
    if (currentLevel) {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_LEVEL, currentLevel);
      console.log('Restored current level from Firebase:', currentLevel);
    }
    if (lastWordId !== undefined && lastWordId !== null) {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_WORD_ID, String(lastWordId));
      console.log('Restored last word ID from Firebase:', lastWordId);
    }
  }
}
