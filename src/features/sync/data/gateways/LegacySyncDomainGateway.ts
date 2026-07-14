import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildStoredProfileFromFirestore, type StoredProfile } from '@features/profile';
import { STORAGE_KEYS } from '@shared/storage';
import {
  getCurrentLevel,
  getLastWordId,
  getUserProgress,
  restoreProgressFromFirebase,
} from '../../../../../services/progressService';
import {
  restoreFavoritesFromFirebase,
  syncFavoritesToFirebaseForUser,
} from '../../../../../services/favoritesService';
import {
  generateVocabulary,
  getLanguagePair,
  getUserLevelFromCefrLevel,
  isUserLevel,
  isVocabularyGenerated,
} from '../../../../../services/vocabularyService';
import {
  getNotificationSettings,
  saveNotificationSettings,
} from '../../../../../services/notificationService';
import { getStreakState, restoreStreakState } from '../../../../../services/streakService';
import type { SyncDomainGateway } from '../../application/contracts';
import type { LocalSyncSnapshot, RemoteUserDocument } from '../../domain/types';

export class LegacySyncDomainGateway implements SyncDomainGateway {
  async buildLocalSnapshot(userId: string): Promise<LocalSyncSnapshot> {
    const learnedWords = await getUserProgress();
    const currentLevel = await getCurrentLevel();
    const lastWordId = await getLastWordId();
    const storedUserLevel = await AsyncStorage.getItem(STORAGE_KEYS.USER_LEVEL);
    const userLevel = isUserLevel(storedUserLevel)
      ? storedUserLevel
      : getUserLevelFromCefrLevel(currentLevel);
    const storedProfile = await AsyncStorage.getItem(`${STORAGE_KEYS.PROFILE_PREFIX}${userId}`);
    const profile = storedProfile ? JSON.parse(storedProfile) : {};
    const hasProfileImage = Object.prototype.hasOwnProperty.call(profile, 'image');
    const rawNotificationSettings = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
    const notificationSettings = rawNotificationSettings ? await getNotificationSettings() : null;
    const streak = await getStreakState();
    const languagePair = await getLanguagePair();
    const hasPreferences = !!(
      languagePair &&
      languagePair.native &&
      languagePair.target &&
      currentLevel
    );

    return {
      currentLevel,
      userLevel,
      lastWordId,
      learnedWords,
      profileName: profile.name,
      profileImage: hasProfileImage ? profile.image ?? null : undefined,
      hasProfileImage,
      notificationSettings,
      streak,
      preferences:
        hasPreferences && languagePair
          ? {
              nativeLanguage: languagePair.native,
              targetLanguage: languagePair.target,
              level: userLevel,
            }
          : null,
    };
  }

  async syncFavorites(userId: string, deviceId: string): Promise<void> {
    await syncFavoritesToFirebaseForUser(userId, deviceId);
  }

  async cacheRemoteProfile(userId: string, remote: RemoteUserDocument): Promise<void> {
    const key = `${STORAGE_KEYS.PROFILE_PREFIX}${userId}`;
    const stored = await AsyncStorage.getItem(key);
    const existingProfile = stored ? (JSON.parse(stored) as StoredProfile) : null;
    const hasFirestorePhotoURL = Object.prototype.hasOwnProperty.call(remote, 'photoURL');
    const profile = buildStoredProfileFromFirestore({
      existingProfile,
      email: remote.email,
      firestoreDisplayName: remote.displayName,
      firestorePhotoURL: hasFirestorePhotoURL ? remote.photoURL : undefined,
      hasFirestorePhotoURL,
    });
    await AsyncStorage.setItem(key, JSON.stringify(profile));
  }

  async restoreRemoteDomains(userId: string, remote: RemoteUserDocument): Promise<void> {
    if (remote.notificationSettings && typeof remote.notificationSettings === 'object') {
      await saveNotificationSettings(remote.notificationSettings, true);
    }
    if (remote.streak && typeof remote.streak === 'object') {
      await restoreStreakState(remote.streak as Parameters<typeof restoreStreakState>[0]);
    }

    const preferenceLevel = remote.preferences?.level;
    const progressLevel = remote.progress?.currentLevel;
    if (typeof preferenceLevel === 'string' || typeof progressLevel === 'string') {
      const restoredUserLevel = isUserLevel(preferenceLevel)
        ? preferenceLevel
        : getUserLevelFromCefrLevel(
            typeof preferenceLevel === 'string' ? preferenceLevel : progressLevel
          );
      await AsyncStorage.setItem(STORAGE_KEYS.USER_LEVEL, restoredUserLevel);
    }

    if (remote.preferences) {
      const { nativeLanguage, targetLanguage } = remote.preferences;
      if (nativeLanguage && targetLanguage) {
        const currentPair = await getLanguagePair();
        const hasVocabulary = await isVocabularyGenerated();
        const languagesChanged = !!(
          currentPair &&
          (currentPair.native !== nativeLanguage || currentPair.target !== targetLanguage)
        );
        await AsyncStorage.setItem(STORAGE_KEYS.NATIVE_LANGUAGE, nativeLanguage);
        await AsyncStorage.setItem(STORAGE_KEYS.TARGET_LANGUAGE, targetLanguage);
        if (!hasVocabulary || languagesChanged) {
          await generateVocabulary(nativeLanguage, targetLanguage);
        }
      }
    }

    if (remote.progress) {
      await restoreProgressFromFirebase(
        remote.progress.learnedWords ?? null,
        remote.progress.currentLevel ?? null,
        remote.progress.lastWordIndex
      );
    }
    await restoreFavoritesFromFirebase(userId);
  }
}
