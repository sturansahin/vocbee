import { getStoredVocabulary, type Level, type VocabularyWord } from '@features/vocabulary';

import { DefaultFavoritesService } from '../application/DefaultFavoritesService';
import { AsyncStorageFavoritesRepository } from '../data/repositories/AsyncStorageFavoritesRepository';
import { FirestoreFavoritesRepository } from '../data/repositories/FirestoreFavoritesRepository';

const remote = new FirestoreFavoritesRepository();
const service = new DefaultFavoritesService(new AsyncStorageFavoritesRepository(), remote, {
  getWords: getStoredVocabulary,
});

export const getFavoriteItems = (userId?: string) => service.getFavoriteItems(userId);
export const getFavorites = () => service.getFavorites();
export const addToFavorites = (word: VocabularyWord, level: Level) => service.addToFavorites(word, level);
export const removeFromFavorites = (wordId: number, level?: Level) => service.removeFromFavorites(wordId, level);
export const isFavorite = (wordId: number, level: Level) => service.isFavorite(wordId, level);
export const clearFavorites = () => service.clearFavorites();
export const clearFavoritesOnFirebase = (userId: string) => service.clearFavoritesOnFirebase(userId);
export const syncFavoritesToFirebase = () => service.syncFavoritesToFirebaseForUser(remote.getCurrentUserId());
export const syncFavoritesToFirebaseForUser = (userId?: string, deviceId?: string) => service.syncFavoritesToFirebaseForUser(userId, deviceId);
export const restoreFavoritesFromFirebase = (userId?: string) => service.restoreFavoritesFromFirebase(userId);
export const getFavoriteIds = async () => [...new Set((await getFavoriteItems()).map(item => item.id))];
