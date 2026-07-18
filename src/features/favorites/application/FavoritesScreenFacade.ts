import type { Level, VocabularyWord } from '@features/vocabulary';

export type FavoriteVocabularyWord = VocabularyWord & { level: Level };

export interface FavoritesScreenSource {
  getFavorites(): Promise<FavoriteVocabularyWord[]>;
  removeFromFavorites(wordId: number, level: Level): Promise<void>;
}

export interface FavoritesScreenFacade {
  list(): Promise<FavoriteVocabularyWord[]>;
  remove(wordId: number, level: Level): Promise<void>;
}

export class DefaultFavoritesScreenFacade implements FavoritesScreenFacade {
  constructor(private readonly source: FavoritesScreenSource) {}

  list() {
    return this.source.getFavorites();
  }

  remove(wordId: number, level: Level) {
    return this.source.removeFromFavorites(wordId, level);
  }
}
