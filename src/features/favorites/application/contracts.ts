import type { Level, VocabularyWord } from '@features/vocabulary';

import type { FavoriteItem } from '../domain/types';

export interface FavoritesLocalStore {
  read(userId?: string): Promise<unknown>;
  write(items: FavoriteItem[], userId?: string, markUnsynced?: boolean): Promise<void>;
  clear(userId?: string, markUnsynced?: boolean): Promise<void>;
}

export interface FavoritesRemoteRepository {
  getCurrentUserId(): string | undefined;
  read(userId: string): Promise<FavoriteItem[] | null>;
  write(userId: string, items: FavoriteItem[], deviceId?: string): Promise<void>;
  clear(userId: string): Promise<void>;
}

export interface FavoritesVocabularySource {
  getWords(level: Level): Promise<VocabularyWord[]>;
}
