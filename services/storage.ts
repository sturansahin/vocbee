// Local Storage Service for VocBee
// Handles all local progress management with AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
    USER_PROGRESS: '@vocbee_user_progress',
    SYNC_FLAG: '@vocbee_needs_sync',
    LAST_SYNC: '@vocbee_last_sync',
    USER_DATA: '@vocbee_user_data',
};

// Types
export interface UserProgress {
    currentLevel: string;
    learnedWords: { [level: string]: number[] };
    skippedWords: { [level: string]: number[] };
    lastUpdated: string;
}

export interface UserData {
    uid: string;
    email: string;
    displayName?: string;
    setupCompleted?: boolean;
    preferences?: {
        nativeLanguage: string;
        targetLanguage: string;
        level: string;
    } | null;
}

// Save local progress
export const saveLocalProgress = async (progress: Partial<UserProgress>): Promise<void> => {
    try {
        const existing = await getLocalProgress();
        const updated: UserProgress = {
            ...existing,
            ...progress,
            lastUpdated: new Date().toISOString(),
        };
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(updated));
        await markAsUnsynced();
    } catch (error) {
        console.error('Error saving local progress:', error);
        throw error;
    }
};

// Get local progress
export const getLocalProgress = async (): Promise<UserProgress> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROGRESS);
        if (data) {
            return JSON.parse(data);
        }
        // Return default progress
        return {
            currentLevel: 'A1',
            learnedWords: {},
            skippedWords: {},
            lastUpdated: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error getting local progress:', error);
        return {
            currentLevel: 'A1',
            learnedWords: {},
            skippedWords: {},
            lastUpdated: new Date().toISOString(),
        };
    }
};

// Mark as needing sync
export const markAsUnsynced = async (): Promise<void> => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.SYNC_FLAG, 'true');
    } catch (error) {
        console.error('Error marking as unsynced:', error);
    }
};

// Check if needs sync
export const needsSync = async (): Promise<boolean> => {
    try {
        const flag = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_FLAG);
        return flag === 'true';
    } catch (error) {
        return false;
    }
};

// Clear sync flag
export const clearSyncFlag = async (): Promise<void> => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.SYNC_FLAG, 'false');
    } catch (error) {
        console.error('Error clearing sync flag:', error);
    }
};

// Get last sync time
export const getLastSyncTime = async (): Promise<Date | null> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
        return data ? new Date(data) : null;
    } catch (error) {
        return null;
    }
};

// Set last sync time
export const setLastSyncTime = async (): Promise<void> => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
        console.error('Error setting last sync time:', error);
    }
};

// Save user data locally
export const saveUserDataLocally = async (userData: UserData): Promise<void> => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
        console.error('Error saving user data locally:', error);
    }
};

// Get local user data
export const getLocalUserData = async (): Promise<UserData | null> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        return null;
    }
};

// Clear all local data (for logout or language change)
export const clearAllLocalData = async (): Promise<void> => {
    try {
        // Get all keys to find shuffle order caches
        const allKeys = await AsyncStorage.getAllKeys();

        // Keys to remove: storage keys + shuffle order caches + progress keys
        const keysToRemove = [
            STORAGE_KEYS.USER_PROGRESS,
            STORAGE_KEYS.SYNC_FLAG,
            STORAGE_KEYS.LAST_SYNC,
            STORAGE_KEYS.USER_DATA,
            // Progress service keys
            '@user_progress',
            '@user_skipped',
            '@current_level',
            '@last_word_id',
            // Add all shuffle order keys
            ...allKeys.filter(key => key.startsWith('@shuffle_order_')),
        ];

        await AsyncStorage.multiRemove(keysToRemove);
        console.log('Cleared all local data including shuffle order caches');
    } catch (error) {
        console.error('Error clearing local data:', error);
    }
};
