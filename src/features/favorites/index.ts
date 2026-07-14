// src/features/favorites — public barrel (docs/refactor-v2/33 §4). Types + interface only (PREP).
export type { FavoriteItem } from './domain/types';
export { mergeFavoriteItems } from './domain/rules';
export type { FavoritesRepository } from './data/contracts';
export * from './composition/favoritesService';
