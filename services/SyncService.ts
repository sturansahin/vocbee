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
import { getUserProgress, getCurrentLevel, restoreProgressFromFirebase, getSkippedProgress, getLastWordIndex } from './progressService';

// Check if sync should happen (once per day)
export const shouldSync = async (): Promise<boolean> => {
    try {
        const hasChanges = await needsSync();
        if (!hasChanges) return false;

        const lastSync = await getLastSyncTime();
        if (!lastSync) return true;

        const now = new Date();
        const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

        // Sync if it's been more than ~1 minute (for testing)
        return hoursSinceLastSync >= 0.016;
    } catch (error) {
        console.error('Error checking sync status:', error);
        return false;
    }
};

// Sync local progress to Firestore
export const syncToFirestore = async (userId: string): Promise<boolean> => {
    try {
        // Get progress from progressService (actual learning data)
        const userProgress = await getUserProgress();
        const skippedProgress = await getSkippedProgress();
        const currentLevel = await getCurrentLevel();
        const lastWordIndex = await getLastWordIndex();

        console.log('Syncing progress to Firestore:', { currentLevel, lastWordIndex });

        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            progress: {
                currentLevel: currentLevel,
                learnedWords: userProgress,
                skippedWords: skippedProgress,
                lastWordIndex: lastWordIndex,
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

// Force sync (on logout, profile change, etc.) - ALWAYS syncs
export const forceSync = async (userId: string): Promise<boolean> => {
    try {
        console.log('Force sync triggered for user:', userId);
        // Always sync on force - don't check needsSync flag
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

            // Restore progress from Firebase to local progressService
            if (data.progress) {
                await restoreProgressFromFirebase(
                    data.progress.learnedWords,
                    data.progress.currentLevel,
                    data.progress.skippedWords,
                    data.progress.lastWordIndex
                );
            }

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
