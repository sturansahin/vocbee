// Sync Service for VocBee
// Handles Firestore synchronization with daily sync strategy

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
    getLocalProgress,
    getLastSyncTime,
    setLastSyncTime,
    clearSyncFlag,
    needsSync,
    UserProgress,
    UserData,
    saveLocalProgress,
    saveUserDataLocally,
} from './storage';

// Check if sync should happen (once per day)
export const shouldSync = async (): Promise<boolean> => {
    try {
        const hasChanges = await needsSync();
        if (!hasChanges) return false;

        const lastSync = await getLastSyncTime();
        if (!lastSync) return true;

        const now = new Date();
        const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

        // Sync if it's been more than 24 hours
        return hoursSinceLastSync >= 0.016;
    } catch (error) {
        console.error('Error checking sync status:', error);
        return false;
    }
};

// Sync local progress to Firestore
export const syncToFirestore = async (userId: string): Promise<boolean> => {
    try {
        const localProgress = await getLocalProgress();

        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            progress: {
                ...localProgress,
                lastSync: serverTimestamp(),
            },
        }, { merge: true });

        await setLastSyncTime();
        await clearSyncFlag();

        console.log('Successfully synced to Firestore');
        return true;
    } catch (error) {
        console.error('Error syncing to Firestore:', error);
        return false;
    }
};

// Force sync (on logout, profile change, etc.)
export const forceSync = async (userId: string): Promise<boolean> => {
    try {
        const hasChanges = await needsSync();
        if (!hasChanges) {
            console.log('No changes to sync');
            return true;
        }

        return await syncToFirestore(userId);
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
                setupCompleted: false, // User needs to complete setup
                preferences: null, // Will be set during setup
                progress: null, // Will be set after setup
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

            const progress: UserProgress = {
                currentLevel: data.progress?.currentLevel || 'A1',
                learnedWords: data.progress?.learnedWords || {},
                skippedWords: data.progress?.skippedWords || {},
                lastUpdated: data.progress?.lastSync?.toDate?.()?.toISOString() || new Date().toISOString(),
            };

            // Save to local storage
            await saveUserDataLocally(userData);
            await saveLocalProgress(progress);
            await clearSyncFlag(); // Data is fresh from server

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
            await syncToFirestore(userId);
        }
    } catch (error) {
        console.error('Error in auto sync:', error);
    }
};
