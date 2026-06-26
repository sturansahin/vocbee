// src/features/favorites/data/contracts.ts
// Layer: data (contracts) | Feature: favorites. Interface only — PREP (docs/refactor-v2/35 §5).
// services/favoritesService.ts keeps running as-is; this is the target shape that encapsulates the
// direct Firestore access (currently inlined in favoritesService) for an incremental migration.

import type { Level, VocabularyWord } from '../../vocabulary';
import type { FavoriteItem } from '../domain/types';

export interface FavoritesRepository {
  getFavoriteItems(userId?: string): Promise<FavoriteItem[]>;        // getFavoriteItems (incl. legacy number[] migration)
  add(word: VocabularyWord, level: Level): Promise<void>;            // addToFavorites
  remove(wordId: number, level?: Level): Promise<void>;             // removeFromFavorites
  isFavorite(wordId: number, level: Level): Promise<boolean>;
  syncToRemote(userId: string, deviceId?: string): Promise<void>;    // syncFavoritesToFirebaseForUser
  restoreFromRemote(userId: string): Promise<void>;                  // restoreFavoritesFromFirebase
  clearRemote(userId: string): Promise<void>;                        // clearFavoritesOnFirebase
}
