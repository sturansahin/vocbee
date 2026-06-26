// src/features/favorites/domain/types.ts
// Layer: domain | Feature: favorites | Pure TS (NO SDK). FavoriteItem is the real shape used by
// services/favoritesService.ts ({ id, level }). Level is reused (type-only) from the vocabulary feature.

import type { Level } from '../../vocabulary';

export type FavoriteItem = { id: number; level: Level };
