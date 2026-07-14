import { DefaultFavoritesService } from '../DefaultFavoritesService';
import type { FavoritesLocalStore, FavoritesRemoteRepository } from '../contracts';
import type { FavoriteItem } from '../../domain/types';
import type { VocabularyWord } from '@features/vocabulary';

const word = (id: number): VocabularyWord => ({ id, word: `word-${id}`, translation: `t-${id}`, sentence1: '', sentence2: '', nativeSentence1: '', nativeSentence2: '' });

class Local implements FavoritesLocalStore {
  values = new Map<string, unknown>();
  read(userId?: string) { return Promise.resolve(this.values.get(userId ?? 'guest') ?? null); }
  write(items: FavoriteItem[], userId?: string) { this.values.set(userId ?? 'guest', structuredClone(items)); return Promise.resolve(); }
  clear(userId?: string) { this.values.delete(userId ?? 'guest'); return Promise.resolve(); }
}
class Remote implements FavoritesRemoteRepository {
  current = 'user-1';
  values = new Map<string, FavoriteItem[]>();
  writes: Array<{ userId: string; items: FavoriteItem[]; deviceId?: string }> = [];
  getCurrentUserId() { return this.current; }
  read(userId: string) { return Promise.resolve(this.values.get(userId) ?? null); }
  write(userId: string, items: FavoriteItem[], deviceId?: string) { this.writes.push({ userId, items, deviceId }); return Promise.resolve(); }
  clear(userId: string) { this.values.set(userId, []); return Promise.resolve(); }
}

describe('DefaultFavoritesService', () => {
  const create = () => {
    const local = new Local();
    const remote = new Remote();
    const service = new DefaultFavoritesService(local, remote, { getWords: async level => level === 'A1' ? [word(1)] : [] });
    return { local, remote, service };
  };

  it('adds, checks and removes a level-aware favorite', async () => {
    const { service } = create();
    await service.addToFavorites(word(1), 'A1');
    await expect(service.isFavorite(1, 'A1')).resolves.toBe(true);
    await service.removeFromFavorites(1, 'A1');
    await expect(service.isFavorite(1, 'A1')).resolves.toBe(false);
  });

  it('migrates legacy numeric ids only into levels where the word exists', async () => {
    const { local, service } = create();
    local.values.set('user-1', [1, 999]);
    await expect(service.getFavoriteItems()).resolves.toEqual([{ id: 1, level: 'A1' }]);
  });

  it('syncs the exact local payload and device id through the remote boundary', async () => {
    const { local, remote, service } = create();
    local.values.set('user-1', [{ id: 1, level: 'A1' }]);
    await service.syncFavoritesToFirebaseForUser('user-1', 'device-1');
    expect(remote.writes).toEqual([{ userId: 'user-1', items: [{ id: 1, level: 'A1' }], deviceId: 'device-1' }]);
  });
});
