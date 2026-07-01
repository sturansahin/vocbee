// src/features/profile/data/repositories/FirestoreUserProfileRepository.ts
// Layer: data (repository impl) | Feature: profile.
//
// ⚠️ PREP / NOT WIRED (Phase 4, docs/refactor-v2/24, /35 §2): not imported by running code, not exported
//    from the barrel (docs/refactor-v2/33 §4), not instantiated. It encapsulates the cache-first profile
//    read/write + the deleteDoc(users/{uid}) currently inlined in AuthContext.deleteAccountRemotely.
//    saveProfile uses MERGE and never removes other/legacy fields. createUserDocument delegates to the
//    existing (tested) SyncService.createUserDocument to preserve exact creation behavior.

import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../../../../config/firebase';
import { STORAGE_KEYS } from '@shared/storage';
import { createUserDocument as syncCreateUserDocument } from '../../../../../services/SyncService';
import type { Profile } from '../../domain/types';
import type { UserProfileRepository } from '../contracts';

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

  async createUserDocument(uid: string, email: string, displayName?: string, photoURL?: string | null): Promise<void> {
    await syncCreateUserDocument(uid, email, displayName, photoURL);
  }

  async deleteUserDocument(uid: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid)); // verbatim from AuthContext.deleteAccountRemotely
  }
}
