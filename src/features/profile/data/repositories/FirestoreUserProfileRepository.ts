// src/features/profile/data/repositories/FirestoreUserProfileRepository.ts
// Layer: data (repository impl) | Feature: profile.
//
// WIRED (ADIM 5 / Phase 4 step 1, docs/refactor-v2/24, /35 §2): composed directly by
// context/AuthContext.tsx (composition root — docs/refactor-v2/33 §4). Currently used for:
// Owns profile cache and users/{uid} profile/document persistence. No presentation module imports
// this implementation; it is bound by auth composition. saveProfile uses merge semantics and never
// removes legacy fields.

import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../../../../config/firebase';
import { STORAGE_KEYS } from '@shared/storage';
import type { Profile } from '../../domain/types';
import type { SetupProfileCompletion, UserProfileRepository } from '../contracts';

export class FirestoreUserProfileRepository implements UserProfileRepository {
  async getCachedProfile(uid: string): Promise<Profile | null> {
    const raw = await AsyncStorage.getItem(`${STORAGE_KEYS.PROFILE_PREFIX}${uid}`);
    return raw ? (JSON.parse(raw) as Profile) : null;
  }

  async cacheProfile(uid: string, profile: Profile): Promise<void> {
    await AsyncStorage.setItem(`${STORAGE_KEYS.PROFILE_PREFIX}${uid}`, JSON.stringify(profile));
  }

  async fetchProfileFromRemote(uid: string): Promise<Profile | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data() as { displayName?: string | null; email?: string | null; photoURL?: string | null };
    return { name: data.displayName ?? '', image: data.photoURL ?? null, email: data.email ?? '' };
  }

  async saveProfile(uid: string, patch: Partial<Profile>): Promise<void> {
    const docPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) docPatch.displayName = patch.name;
    if (patch.image !== undefined) docPatch.photoURL = patch.image;
    if (patch.email !== undefined) docPatch.email = patch.email;
    await setDoc(doc(db, 'users', uid), docPatch, { merge: true }); // merge: legacy fields preserved
  }

  async saveSetupCompletion(
    uid: string,
    completion: SetupProfileCompletion
  ): Promise<void> {
    await setDoc(
      doc(db, 'users', uid),
      {
        setupCompleted: true,
        preferences: completion.preferences,
        progress: {
          currentLevel: completion.initialLevel,
          learnedWords: {},
          lastSync: serverTimestamp(),
        },
        notificationSettings: completion.notificationSettings,
      },
      { merge: true }
    );
  }

  async createUserDocument(uid: string, email: string, displayName?: string, photoURL?: string | null): Promise<void> {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
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

  async deleteUserDocument(uid: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid)); // verbatim from AuthContext.deleteAccountRemotely
  }
}
