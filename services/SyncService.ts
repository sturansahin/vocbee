// Sync Service for VocBee
// Handles Firestore synchronization with daily sync strategy

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
    getLastSyncTime,
    setLastSyncTime,
    clearSyncFlag,
    needsSync,
    UserData,
    saveUserDataLocally,
} from './storage';
import { getUserProgress, getCurrentLevel, restoreProgressFromFirebase, getLastWordIndex } from './progressService';
import { restoreFavoritesFromFirebase, syncFavoritesToFirebase } from './favoritesService';

// Check if sync should happen (once per day)
export const shouldSync = async (): Promise<boolean> => {
    try {
        const hasChanges = await needsSync();
        if (!hasChanges) return false;

        const lastSync = await getLastSyncTime();
        if (!lastSync) return true;

        const now = new Date();
        const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

        // Sync if it's been more than 24 hours (daily sync)
        return hoursSinceLastSync >= 24;
    } catch (error) {
        console.error('Error checking sync status:', error);
        return false;
    }
};

// Sync local progress, favorites, and profile to Firestore
export const syncToFirestore = async (userId: string): Promise<boolean> => {
    try {
        // Get progress from progressService (actual learning data)
        const userProgress = await getUserProgress();
        const currentLevel = await getCurrentLevel();
        const lastWordIndex = await getLastWordIndex();

        // Get profile data from AsyncStorage
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const storedProfile = await AsyncStorage.getItem(`profile_${userId}`);
        const profileData = storedProfile ? JSON.parse(storedProfile) : {};
        const profileName = profileData.name;
        const profileImage = profileData.image;

        console.log('Syncing progress and profile to Firestore:', { currentLevel, lastWordIndex, hasProfileName: !!profileName, hasProfileImage: !!profileImage });

        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            progress: {
                currentLevel: currentLevel,
                learnedWords: userProgress,
                lastWordIndex: lastWordIndex,
                lastSync: serverTimestamp(),
            },
            // Sync profile name if available
            ...(profileName && { displayName: profileName }),
            // Sync profile image if available
            ...(profileImage && { photoURL: profileImage }),
        }, { merge: true });

        // Sync favorites
        await syncFavoritesToFirebase();

        await setLastSyncTime();
        await clearSyncFlag();

        console.log('Successfully synced progress, profile and favorites to Firestore');
        return true;
    } catch (error) {
        console.error('Error syncing to Firestore:', error);
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

// Create new user document in Firestore
export const createUserDocument = async (
    userId: string,
    email: string,
    displayName?: string
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            await setDoc(userRef, {
                email,
                displayName: displayName || '',
                createdAt: serverTimestamp(),
                setupCompleted: false,
                preferences: null,
                progress: null,
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

            const userData: UserData = {
                uid: userId,
                email: data.email,
                displayName: data.displayName,
                preferences: data.preferences,
            };

            await saveUserDataLocally(userData);

            // Restore profile data from Firebase to AsyncStorage
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const newProfile = {
                name: data.displayName || '',
                image: data.photoURL || null,
                email: data.email || ''
            };
            await AsyncStorage.setItem(`profile_${userId}`, JSON.stringify(newProfile));

            // Restore language preferences from Firebase to AsyncStorage
            if (data.preferences) {
                const { nativeLanguage, targetLanguage } = data.preferences;
                if (nativeLanguage && targetLanguage) {
                    await AsyncStorage.setItem('@native_language', nativeLanguage);
                    await AsyncStorage.setItem('@target_language', targetLanguage);
                    console.log(`Restored language preferences: ${nativeLanguage} -> ${targetLanguage}`);

                    // Check if vocabulary needs to be generated
                    const { isVocabularyGenerated, generateVocabulary } = require('./vocabularyService');
                    const hasVocab = await isVocabularyGenerated();
                    if (!hasVocab) {
                        console.log('Generating vocabulary for restored preferences...');
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
                    data.progress.skippedWords,
                    data.progress.lastWordIndex
                );
            }

            // Restore favorites from Firebase
            await restoreFavoritesFromFirebase();

            await clearSyncFlag();

            return userData;
        }
        return null;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
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
