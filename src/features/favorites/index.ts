// src/features/favorites — public barrel (docs/architecture.md). Types + interface only (PREP).
export { FAVORITE_LEVELS, type FavoriteItem } from './domain/types';
export { mergeFavoriteItems } from './domain/rules';
export type { FavoritesRepository } from './data/contracts';
export type {
  FavoritesScreenFacade,
  FavoriteVocabularyWord,
} from './application/FavoritesScreenFacade';
export * from './composition/favoritesService';
export { default as FavoritesScreen } from './composition/FavoritesScreen';
