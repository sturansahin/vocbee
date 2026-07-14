import type { Level } from '@features/vocabulary';

import { FAVORITE_LEVELS, type FavoriteItem } from './types';

export function mergeFavoriteItems(items: FavoriteItem[]): FavoriteItem[] {
  const seen = new Set<string>();
  const merged: FavoriteItem[] = [];
  for (const item of items) {
    if (!item || typeof item.id !== 'number' || !FAVORITE_LEVELS.includes(item.level as Level)) continue;
    const key = `${item.level}:${item.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({ id: item.id, level: item.level });
    }
  }
  return merged;
}
