import AsyncStorage from '@react-native-async-storage/async-storage';

import { markAsUnsynced, STORAGE_KEYS } from '@shared/storage';

import type { StreakRepository } from '../../application/contracts';
import type { StreakState } from '../../domain/types';

export class AsyncStorageStreakRepository implements StreakRepository {
  async read(): Promise<unknown | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.STREAK);
    return raw ? JSON.parse(raw) : null;
  }
  async write(state: StreakState, shouldMarkUnsynced: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(state));
    if (shouldMarkUnsynced) await markAsUnsynced();
  }
  clear(): Promise<void> {
    return AsyncStorage.removeItem(STORAGE_KEYS.STREAK);
  }
}
