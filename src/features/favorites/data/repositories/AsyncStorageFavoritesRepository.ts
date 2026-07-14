import AsyncStorage from '@react-native-async-storage/async-storage';

import { markAsUnsynced } from '@shared/storage';

import type { FavoritesLocalStore } from '../../application/contracts';
import type { FavoriteItem } from '../../domain/types';

const keyFor = (userId?: string) => userId ? `@favorites_${userId}` : '@favorites';

export class AsyncStorageFavoritesRepository implements FavoritesLocalStore {
  async read(userId?: string): Promise<unknown> {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    return raw ? JSON.parse(raw) : null;
  }

  async write(items: FavoriteItem[], userId?: string, shouldMarkUnsynced = true): Promise<void> {
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(items));
    if (shouldMarkUnsynced) await markAsUnsynced();
  }

  async clear(userId?: string, shouldMarkUnsynced = true): Promise<void> {
    await AsyncStorage.removeItem(keyFor(userId));
    if (shouldMarkUnsynced) await markAsUnsynced();
  }
}
