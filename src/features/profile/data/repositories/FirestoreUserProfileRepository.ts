// src/features/profile/data/repositories/FirestoreUserProfileRepository.ts
// Layer: data (repository impl) | Feature: profile.
//
// WIRED (ADIM 5 / Phase 4 step 1, docs/refactor-v2/24, /35 §2): composed directly by
// context/AuthContext.tsx (composition root — docs/refactor-v2/33 §4). Currently used for:
// Owns profile cache and users/{uid} profile/document persistence. No presentation module imports
// this implementation; it is bound by auth composition. saveProfile uses merge semantics and never
// removes legacy fields.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildProgressV2WritePlan,
  getProgressSyncMode,
  PROGRESS_BY_LEVEL_DOC_VERSION,
  PROGRESS_SCHEMA_VERSION,
} from '@features/progress';
import { VOCABULARY_SCHEMA_VERSION } from '@features/vocabulary';
import { db } from '@shared/firebase';
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
    const timestamp = serverTimestamp();
    const userReference = doc(db, 'users', uid);
    const legacyData = {
      setupCompleted: true,
      preferences: completion.preferences,
      progress: {
        currentLevel: completion.initialLevel,
        learnedWords: {},
        lastSync: timestamp,
      },
      notificationSettings: completion.notificationSettings,
    };
    if (getProgressSyncMode() !== 'dual') {
      await setDoc(userReference, legacyData, { merge: true });
      return;
    }

    const plan = buildProgressV2WritePlan({
      currentLevel: completion.initialLevel,
      learnedWords: {},
      lastWordId: 0,
      vocabularySchemaVersion: VOCABULARY_SCHEMA_VERSION,
    });
    const batch = writeBatch(db);
    batch.set(userReference, {
      ...legacyData,
      activeLevel: plan.activeLevel,
      schemaVersion: PROGRESS_SCHEMA_VERSION,
      lastActiveAt: timestamp,
      progressSummary: { ...plan.summary, updatedAt: timestamp },
      syncMeta: { version: 2, updatedAt: timestamp, updatedByDeviceId: 'setup' },
    }, { merge: true });
    for (const level of plan.levels) {
      batch.set(doc(db, 'users', uid, 'progressByLevel', level.level), {
        ...level,
        updatedAt: timestamp,
        updatedByDeviceId: 'setup',
        version: PROGRESS_BY_LEVEL_DOC_VERSION,
      }, { merge: true });
    }
    await batch.commit();
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
    const userReference = doc(db, 'users', uid);
    const progressSnapshot = await getDocs(collection(userReference, 'progressByLevel'));
    const batch = writeBatch(db);
    for (const progressDocument of progressSnapshot.docs) batch.delete(progressDocument.ref);
    batch.delete(userReference);
    await batch.commit();
  }
}
