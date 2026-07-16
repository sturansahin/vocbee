import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '@shared/firebase';
import type { SyncRepository } from '../../application/contracts';
import type {
  AuthProfileSyncInput,
  LocalSyncSnapshot,
  RemoteUserDocument,
  SyncNotificationSettings,
} from '../../domain/types';

export class FirestoreSyncRepository implements SyncRepository {
  async getActiveDeviceId(userId: string): Promise<string | null> {
    const snapshot = await getDoc(doc(db, 'users', userId));
    if (!snapshot.exists()) return null;
    return snapshot.data().lastActiveDeviceId || null;
  }

  async getUserDocument(userId: string): Promise<RemoteUserDocument | null> {
    const snapshot = await getDoc(doc(db, 'users', userId));
    return snapshot.exists() ? (snapshot.data() as RemoteUserDocument) : null;
  }

  async saveSnapshot(userId: string, snapshot: LocalSyncSnapshot, deviceId: string): Promise<void> {
    const data: Record<string, unknown> = {
      progress: {
        currentLevel: snapshot.currentLevel,
        learnedWords: snapshot.learnedWords,
        lastWordIndex: snapshot.lastWordId ?? 0,
        lastSync: serverTimestamp(),
      },
      lastActiveDeviceId: deviceId,
      streak: snapshot.streak,
      syncMeta: {
        version: 1,
        updatedAt: serverTimestamp(),
        updatedByDeviceId: deviceId,
      },
    };
    if (snapshot.profileName) data.displayName = snapshot.profileName;
    if (snapshot.hasProfileImage) data.photoURL = snapshot.profileImage ?? null;
    if (snapshot.notificationSettings) data.notificationSettings = snapshot.notificationSettings;
    if (snapshot.preferences) {
      data.preferences = snapshot.preferences;
      data.setupCompleted = true;
    }
    await setDoc(doc(db, 'users', userId), data, { merge: true });
  }

  async createUserDocument(
    userId: string,
    email: string,
    displayName?: string,
    photoURL?: string | null
  ): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const snapshot = await getDoc(userRef);
    if (!snapshot.exists()) {
      await setDoc(userRef, {
        email,
        displayName: displayName || '',
        photoURL: photoURL ?? null,
        createdAt: serverTimestamp(),
        setupCompleted: false,
        preferences: null,
        progress: null,
        streak: null,
      });
    }
  }

  async saveNotificationSettings(
    userId: string,
    settings: SyncNotificationSettings,
    deviceId: string
  ): Promise<void> {
    await setDoc(
      doc(db, 'users', userId),
      {
        notificationSettings: settings,
        syncMeta: {
          version: 1,
          updatedAt: serverTimestamp(),
          updatedByDeviceId: deviceId,
        },
      },
      { merge: true }
    );
  }

  async saveAuthProfile(
    userId: string,
    profile: AuthProfileSyncInput,
    deviceId: string
  ): Promise<void> {
    const profileData: Record<string, string | null> = { email: profile.email };
    if (typeof profile.displayName === 'string' && profile.displayName.trim()) {
      profileData.displayName = profile.displayName.trim();
    }
    if (profile.photoURL !== undefined) {
      profileData.photoURL =
        typeof profile.photoURL === 'string' && profile.photoURL.trim()
          ? profile.photoURL.trim()
          : null;
    }
    await setDoc(
      doc(db, 'users', userId),
      {
        ...profileData,
        syncMeta: {
          version: 1,
          updatedAt: serverTimestamp(),
          updatedByDeviceId: deviceId,
        },
      },
      { merge: true }
    );
  }
}
