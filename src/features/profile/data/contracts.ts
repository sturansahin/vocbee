// src/features/profile/data/contracts.ts
// Layer: data (contracts) | Feature: profile. Interface only (docs/refactor-v2/35 §2).
// Encapsulates cache-first profile (profile_${uid}) + users/{uid} doc read/write/create/DELETE.

import type { Profile } from '../domain/types';

export interface SetupProfileCompletion {
  preferences: {
    nativeLanguage: string;
    targetLanguage: string;
    level: string;
  };
  initialLevel: string;
  notificationSettings:
    | {
        enabled: true;
        startHour: number;
        startMinute: number;
        endHour: number;
        endMinute: number;
        frequencyMinutes: number;
        autoMarkLearned: true;
      }
    | { enabled: false };
}

export interface UserProfileRepository {
  /** Cache-first read from AsyncStorage profile_${uid}. */
  getCachedProfile(uid: string): Promise<Profile | null>;
  cacheProfile(uid: string, profile: Profile): Promise<void>;
  /** Remote read from users/{uid} (legacy-compatible). */
  fetchProfileFromRemote(uid: string): Promise<Profile | null>;
  /** Merge-write profile fields to users/{uid} (never deletes other/legacy fields). */
  saveProfile(uid: string, patch: Partial<Profile>): Promise<void>;
  /** Merge setupCompleted/preferences/progress/notificationSettings into users/{uid}. */
  saveSetupCompletion(uid: string, completion: SetupProfileCompletion): Promise<void>;
  createUserDocument(
    uid: string,
    email: string,
    displayName?: string,
    photoURL?: string | null,
  ): Promise<void>;
  /** deleteDoc(users/{uid}) — the call currently inlined in AuthContext.deleteAccountRemotely. */
  deleteUserDocument(uid: string): Promise<void>;
}
