import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from '@shared/firebase';

import type { FavoritesRemoteRepository } from '../../application/contracts';
import type { FavoriteItem } from '../../domain/types';

export class FirestoreFavoritesRepository implements FavoritesRemoteRepository {
  getCurrentUserId(): string | undefined { return auth.currentUser?.uid; }

  async read(userId: string): Promise<FavoriteItem[] | null> {
    const snapshot = await getDoc(doc(db, 'users', userId));
    if (!snapshot.exists()) return null;
    const favorites = snapshot.data().favorites;
    return Array.isArray(favorites) ? favorites as FavoriteItem[] : null;
  }

  async write(userId: string, items: FavoriteItem[], deviceId?: string): Promise<void> {
    const syncMeta: Record<string, unknown> = { version: 1, updatedAt: serverTimestamp() };
    if (deviceId) syncMeta.updatedByDeviceId = deviceId;
    await setDoc(doc(db, 'users', userId), { favorites: items, syncMeta }, { merge: true });
  }

  async clear(userId: string): Promise<void> {
    await setDoc(doc(db, 'users', userId), { favorites: [] }, { merge: true });
  }
}
