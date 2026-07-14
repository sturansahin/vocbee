import type { Level, VocabularyWord } from '@features/vocabulary';

import { FAVORITE_LEVELS, type FavoriteItem } from '../domain/types';
import { mergeFavoriteItems } from '../domain/rules';
import type { FavoritesLocalStore, FavoritesRemoteRepository, FavoritesVocabularySource } from './contracts';

export class DefaultFavoritesService {
  constructor(
    private readonly local: FavoritesLocalStore,
    private readonly remote: FavoritesRemoteRepository,
    private readonly vocabulary: FavoritesVocabularySource
  ) {}

  private userId(override?: string): string | undefined { return override ?? this.remote.getCurrentUserId(); }

  async getFavoriteItems(userId?: string): Promise<FavoriteItem[]> {
    try {
      const resolvedUserId = this.userId(userId);
      const parsed = await this.local.read(resolvedUserId);
      if (!Array.isArray(parsed) || parsed.length === 0) return [];
      if (typeof parsed[0] === 'number') {
        console.log('Migrating legacy favorites to level-aware format...');
        const migrated: FavoriteItem[] = [];
        for (const id of parsed) {
          for (const level of FAVORITE_LEVELS) {
            if ((await this.vocabulary.getWords(level)).find(word => word.id === id)) migrated.push({ id, level });
          }
        }
        await this.local.write(migrated, resolvedUserId, false);
        return migrated;
      }
      return mergeFavoriteItems(parsed as FavoriteItem[]);
    } catch (error) { console.error('Error getting favorites:', error); return []; }
  }

  async getFavorites(): Promise<Array<VocabularyWord & { level: Level }>> {
    try {
      const items = await this.getFavoriteItems();
      if (items.length === 0) return [];
      const byLevel: Partial<Record<Level, number[]>> = {};
      items.forEach(item => { (byLevel[item.level] ??= []).push(item.id); });
      const result: Array<VocabularyWord & { level: Level }> = [];
      for (const level of Object.keys(byLevel) as Level[]) {
        const ids = byLevel[level] ?? [];
        result.push(...(await this.vocabulary.getWords(level)).filter(word => ids.includes(word.id)).map(word => ({ ...word, level })));
      }
      return result;
    } catch (error) { console.error('Error getting favorites with details:', error); return []; }
  }

  async addToFavorites(word: VocabularyWord, level: Level): Promise<void> {
    try {
      const items = await this.getFavoriteItems();
      if (items.some(item => item.id === word.id && item.level === level)) {
        console.log('Word already in favorites');
        return;
      }
      items.push({ id: word.id, level });
      await this.local.write(items, this.userId());
      console.log('Added to favorites:', word.word, `(${level})`);
    } catch (error) { console.error('Error adding to favorites:', error); }
  }

  async removeFromFavorites(wordId: number, level?: Level): Promise<void> {
    try {
      const items = await this.getFavoriteItems();
      const filtered = level
        ? items.filter(item => !(item.id === wordId && item.level === level))
        : items.filter(item => item.id !== wordId);
      await this.local.write(filtered, this.userId());
      console.log('Removed from favorites');
    } catch (error) { console.error('Error removing from favorites:', error); }
  }

  async isFavorite(wordId: number, level: Level): Promise<boolean> {
    try { return (await this.getFavoriteItems()).some(item => item.id === wordId && item.level === level); }
    catch (error) { console.error('Error checking favorite:', error); return false; }
  }

  async clearFavorites(): Promise<void> {
    try { await this.local.clear(this.userId()); console.log('Cleared all favorites'); }
    catch (error) { console.error('Error clearing favorites:', error); }
  }

  async clearFavoritesOnFirebase(userId: string): Promise<void> {
    try { if (userId) { await this.remote.clear(userId); console.log('Cleared favorites on Firebase for user:', userId); } }
    catch (error) { console.error('Error clearing favorites on Firebase:', error); }
  }

  async syncFavoritesToFirebaseForUser(userId?: string, deviceId?: string): Promise<void> {
    try {
      if (!userId) throw new Error('Cannot sync favorites without an authenticated user.');
      const items = await this.getFavoriteItems(userId);
      await this.remote.write(userId, items, deviceId);
      console.log('Favorites synced to Firebase:', items.length, 'items');
    } catch (error) { console.error('Error syncing favorites to Firebase:', error); throw error; }
  }

  async restoreFavoritesFromFirebase(userIdOverride?: string): Promise<void> {
    try {
      const userId = this.userId(userIdOverride);
      if (!userId) return;
      const remoteItems = await this.remote.read(userId);
      if (!remoteItems) return;
      const merged = mergeFavoriteItems([...(await this.getFavoriteItems(userId)), ...remoteItems]);
      await this.local.write(merged, userId, false);
      console.log('Favorites restored from Firebase:', merged.length, 'items');
    } catch (error) { console.error('Error restoring favorites from Firebase:', error); }
  }
}
