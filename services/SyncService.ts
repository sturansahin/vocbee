// Sync Service for VocBee
// Handles Firestore synchronization with daily sync strategy

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getLastSyncTime,
    setLastSyncTime,
    clearSyncFlag,
    needsSync,
    UserData,
    saveUserDataLocally,
    getDeviceId,
    STORAGE_KEYS,
} from '@shared/storage';
import { getUserProgress, getCurrentLevel, restoreProgressFromFirebase, getLastWordId } from './progressService';
import { restoreFavoritesFromFirebase, syncFavoritesToFirebaseForUser } from './favoritesService';
import { getLanguagePair, isVocabularyGenerated, generateVocabulary, getUserLevelFromCefrLevel, isUserLevel } from './vocabularyService';
import { getNotificationSettings, saveNotificationSettings, NotificationSettings } from './notificationService';
import { getStreakState, restoreStreakState, StreakState } from './streakService';
import { buildStoredProfileFromFirestore } from './socialAuthProfile';

// ─── Retry Helper with Exponential Backoff ───────────────────────────────────
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MUTATION_SYNC_DEBOUNCE_MS = 5 * 60 * 1000;

async function withRetry<T>(
    fn: () => Promise<T>,
    label: string,
    retries = MAX_RETRIES
): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (attempt < retries) {
                const delay = BASE_DELAY_MS * Math.pow(2, attempt);
                console.warn(`[SyncService] ${label} failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`);
                await new Promise<void>(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}
// ─────────────────────────────────────────────────────────────────────────────

// Check if sync should happen (once per day)
export const shouldSync = async (): Promise<boolean> => {
    try {
        const hasChanges = await needsSync();
        if (!hasChanges) return false;

        const lastSync = await getLastSyncTime();
        if (!lastSync) return true;

        const now = new Date();
        const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

        // Local mutations should not wait for the old 24h daily window.
        return hoursSinceLastSync * 60 * 60 * 1000 >= MUTATION_SYNC_DEBOUNCE_MS;
    } catch (error) {
        console.error('Error checking sync status:', error);
        return false;
    }
};

// Sync local progress, favorites, and profile to Firestore (with retry)
export const syncToFirestore = async (userId: string): Promise<boolean> => {
    try {
        return await withRetry(async () => {
        // Get progress from progressService (actual learning data)
        const userProgress = await getUserProgress();
        const currentLevel = await getCurrentLevel();
        const lastWordId = await getLastWordId();
        const storedUserLevel = await AsyncStorage.getItem(STORAGE_KEYS.USER_LEVEL);
        const userLevel = isUserLevel(storedUserLevel)
            ? storedUserLevel
            : getUserLevelFromCefrLevel(currentLevel);

        // Get profile data from AsyncStorage
        const storedProfile = await AsyncStorage.getItem(`${STORAGE_KEYS.PROFILE_PREFIX}${userId}`);
        const profileData = storedProfile ? JSON.parse(storedProfile) : {};
        const profileName = profileData.name;
        const hasProfileImage = Object.prototype.hasOwnProperty.call(profileData, 'image');
        const profileImage = hasProfileImage ? profileData.image ?? null : undefined;
        const rawNotificationSettings = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
        const notificationSettings = rawNotificationSettings
            ? await getNotificationSettings()
            : null;
        const streakState = await getStreakState();

        // Get language preferences
        const languagePair = await getLanguagePair();
        // Check if we have valid preferences (need both languages and a level)
        const hasPreferences = !!(languagePair && languagePair.native && languagePair.target && currentLevel);

        console.log('Syncing progress, profile and preferences to Firestore:', {
            currentLevel,
            userLevel,
            lastWordId,
            hasProfileName: !!profileName,
            hasPreferences
        });

        const userRef = doc(db, 'users', userId);

        // Get current device ID
        const deviceId = await getDeviceId();

        // Prepare data payload
        const syncData: any = {
            progress: {
                currentLevel: currentLevel,
                learnedWords: userProgress,
                lastWordIndex: lastWordId ?? 0,
                lastSync: serverTimestamp(),
            },
            // Track which device last synced
            lastActiveDeviceId: deviceId,
            // Update profile info
            ...(profileName && { displayName: profileName }),
        };

        if (profileImage !== undefined) {
            syncData.photoURL = profileImage;
        }

        if (notificationSettings) {
            syncData.notificationSettings = notificationSettings;
        }

        syncData.streak = streakState;

        // If we have valid preferences locally, force update them in Firestore
        // This ensures the user is marked as "Setup Completed"
        if (hasPreferences && languagePair) {
            syncData.preferences = {
                nativeLanguage: languagePair.native,
                targetLanguage: languagePair.target,
                level: userLevel,
            };
            syncData.setupCompleted = true;
        }

        syncData.syncMeta = {
            version: 1,
            updatedAt: serverTimestamp(),
            updatedByDeviceId: deviceId,
        };

        const syncResults = await Promise.allSettled([
            setDoc(userRef, syncData, { merge: true }),
            syncFavoritesToFirebaseForUser(userId, deviceId),
        ]);

        const failedResults = syncResults.filter(
            (result): result is PromiseRejectedResult => result.status === 'rejected'
        );
        if (failedResults.length > 0) {
            failedResults.forEach(result => {
                console.error('[SyncService] Domain sync failed:', result.reason);
            });
            throw new Error('One or more sync domains failed.');
        }

        await setLastSyncTime();
        await clearSyncFlag();

        console.log('Successfully synced progress, profile and favorites to Firestore');
        return true;
        }, 'syncToFirestore');
    } catch (error) {
        console.error('Error syncing to Firestore after retries:', error);
        return false;
    }
};

// Force sync (on logout, profile change, etc.) - ALWAYS syncs progress AND favorites
export const forceSync = async (userId: string): Promise<boolean> => {
    try {
        console.log('Force sync triggered for user:', userId);
        // Always sync on force - don't check needsSync flag
        const result = await syncToFirestore(userId);
        console.log('Force sync completed - progress and favorites synced');
        return result;
    } catch (error) {
        console.error('Error in force sync:', error);
        return false;
    }
};

// Get the last active device ID from Firebase (for device change detection)
export const getActiveDeviceIdFromFirebase = async (userId: string): Promise<string | null> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const data = userDoc.data();
            return data.lastActiveDeviceId || null;
        }
        return null;
    } catch (error) {
        console.error('Error getting active device ID from Firebase:', error);
        return null;
    }
};

// Create new user document in Firestore
export const createUserDocument = async (
    userId: string,
    email: string,
    displayName?: string,
    photoURL?: string | null
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
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
            console.log('Created new user document');
        }
    } catch (error) {
        console.error('Error creating user document:', error);
        throw error;
    }
};

// Fetch user data from Firestore and save locally
export const fetchAndSaveUserData = async (userId: string): Promise<UserData | null> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const data = userDoc.data();
            console.log('[SyncService] Raw Firebase data:', JSON.stringify({
                setupCompleted: data.setupCompleted,
                hasPreferences: !!data.preferences,
                preferences: data.preferences,
                hasProgress: !!data.progress,
                hasNotificationSettings: !!data.notificationSettings,
                hasStreak: !!data.streak,
            }, null, 2));

            const userData: UserData = {
                uid: userId,
                email: data.email,
                displayName: data.displayName,
                setupCompleted: data.setupCompleted,
                preferences: data.preferences,
            };

            const hasUnsyncedLocalChanges = await needsSync();
            await saveUserDataLocally(userData);

            const storedProfile = await AsyncStorage.getItem(`${STORAGE_KEYS.PROFILE_PREFIX}${userId}`);
            const existingProfile = storedProfile ? JSON.parse(storedProfile) : null;
            const hasFirestorePhotoURL = Object.prototype.hasOwnProperty.call(data, 'photoURL');

            // Restore profile data from Firebase to AsyncStorage while preserving
            // auth/provider fallbacks when Firestore fields are still sparse.
            const newProfile = buildStoredProfileFromFirestore({
                existingProfile,
                email: data.email,
                firestoreDisplayName: data.displayName,
                firestorePhotoURL: hasFirestorePhotoURL ? data.photoURL : undefined,
                hasFirestorePhotoURL,
            });
            await AsyncStorage.setItem(`${STORAGE_KEYS.PROFILE_PREFIX}${userId}`, JSON.stringify(newProfile));

            if (hasUnsyncedLocalChanges) {
                console.warn('[SyncService] Local unsynced changes detected; skipping cloud domain restore.');
                return userData;
            }

            if (data.notificationSettings && typeof data.notificationSettings === 'object') {
                await saveNotificationSettings(data.notificationSettings, true);
                console.log('Restored notification settings from Firebase');
            }

            if (data.streak && typeof data.streak === 'object') {
                await restoreStreakState(data.streak as Partial<StreakState>);
                console.log('Restored streak state from Firebase');
            }

            // Restore user-level preference (beginner/intermediate/advanced).
            // Handles both current schema and older builds that may have stored CEFR here.
            const preferenceLevel = data.preferences?.level;
            const progressLevel = data.progress?.currentLevel;
            if (typeof preferenceLevel === 'string' || typeof progressLevel === 'string') {
                const restoredUserLevel = isUserLevel(preferenceLevel)
                    ? preferenceLevel
                    : getUserLevelFromCefrLevel(
                        typeof preferenceLevel === 'string' ? preferenceLevel : progressLevel
                    );
                await AsyncStorage.setItem(STORAGE_KEYS.USER_LEVEL, restoredUserLevel);
                console.log(`Restored user level preference: ${restoredUserLevel}`);
            }

            // Restore language preferences from Firebase to AsyncStorage
            if (data.preferences) {
                const { nativeLanguage, targetLanguage } = data.preferences;
                if (nativeLanguage && targetLanguage) {
                    // Get CURRENT language pair BEFORE overwriting with new values
                    const currentPair = await getLanguagePair();
                    const hasVocab = await isVocabularyGenerated();

                    // Check if languages changed (compare OLD values with NEW Firebase values)
                    const languagesChanged = currentPair &&
                        (currentPair.native !== nativeLanguage || currentPair.target !== targetLanguage);

                    // Now write the new language preferences
                    await AsyncStorage.setItem(STORAGE_KEYS.NATIVE_LANGUAGE, nativeLanguage);
                    await AsyncStorage.setItem(STORAGE_KEYS.TARGET_LANGUAGE, targetLanguage);
                    console.log(`Restored language preferences: ${nativeLanguage} -> ${targetLanguage}`);

                    // Regenerate if no vocabulary OR if language pair changed
                    if (!hasVocab || languagesChanged) {
                        console.log(languagesChanged
                            ? `Language changed from ${currentPair?.native}->${currentPair?.target} to ${nativeLanguage}->${targetLanguage}, regenerating...`
                            : 'Generating vocabulary for restored preferences...');
                        await generateVocabulary(nativeLanguage, targetLanguage);
                        console.log('Vocabulary generated successfully');
                    }
                }
            }

            // Restore progress from Firebase to local progressService
            if (data.progress) {
                await restoreProgressFromFirebase(
                    data.progress.learnedWords,
                    data.progress.currentLevel,
                    data.progress.lastWordIndex
                );
            }

            // Restore favorites from Firebase
            await restoreFavoritesFromFirebase(userId);

            await clearSyncFlag();

            return userData;
        }
        return null;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
};

export const syncNotificationSettingsToFirestore = async (
    userId: string,
    settings: NotificationSettings
): Promise<void> => {
    await withRetry(async () => {
        const userRef = doc(db, 'users', userId);
        const deviceId = await getDeviceId();
        await setDoc(userRef, {
            notificationSettings: settings,
            syncMeta: {
                version: 1,
                updatedAt: serverTimestamp(),
                updatedByDeviceId: deviceId,
            },
        }, { merge: true });
    }, 'syncNotificationSettingsToFirestore');
};

export const syncAuthProfileToFirestore = async (
    userId: string,
    profile: {
        email: string;
        displayName?: string | null;
        photoURL?: string | null;
    }
): Promise<void> => {
    await withRetry(async () => {
        const userRef = doc(db, 'users', userId);
        const syncData: Record<string, string | null> = {
            email: profile.email,
        };

        if (typeof profile.displayName === 'string' && profile.displayName.trim()) {
            syncData.displayName = profile.displayName.trim();
        }

        if (profile.photoURL !== undefined) {
            syncData.photoURL =
                typeof profile.photoURL === 'string' && profile.photoURL.trim()
                    ? profile.photoURL.trim()
                    : null;
        }

        const deviceId = await getDeviceId();
        await setDoc(userRef, {
            ...syncData,
            syncMeta: {
                version: 1,
                updatedAt: serverTimestamp(),
                updatedByDeviceId: deviceId,
            },
        }, { merge: true });
    }, 'syncAuthProfileToFirestore');
};

// Auto sync on app background (called from AppState listener)
export const autoSync = async (userId: string | null): Promise<void> => {
    if (!userId) return;

    try {
        const shouldDoSync = await shouldSync();
        if (shouldDoSync) {
            console.log('Auto sync triggered...');
            await syncToFirestore(userId);
        }
    } catch (error) {
        console.error('Error in auto sync:', error);
    }
};
