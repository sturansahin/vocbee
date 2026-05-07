// Local Storage Service for VocBee
// Handles all local progress management with AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storageKeys';

// Local keys (referencing centralized keys)
const LOCAL_KEYS = {
    USER_PROGRESS: STORAGE_KEYS.USER_PROGRESS_LEGACY,
    SYNC_FLAG: STORAGE_KEYS.SYNC_FLAG,
    LAST_SYNC: STORAGE_KEYS.LAST_SYNC,
    USER_DATA: STORAGE_KEYS.USER_DATA,
    DEVICE_ID: STORAGE_KEYS.DEVICE_ID,
};

// Types
export interface UserProgress {
    currentLevel: string;
    learnedWords: { [level: string]: number[] };
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

interface ClearAllLocalDataOptions {
    preserveStreak?: boolean;
    fullPurge?: boolean;
}

// Save local progress — DEPRECATED: Progress is managed by progressService.ts
// Kept as a small compatibility layer for legacy tests and migration safety.
export const getLocalProgress = async (): Promise<UserProgress> => {
    const defaultProgress = (): UserProgress => ({
        currentLevel: 'A1',
        learnedWords: {},
        lastUpdated: new Date().toISOString(),
    });

    try {
        const data = await AsyncStorage.getItem(LOCAL_KEYS.USER_PROGRESS);
        if (!data) {
            return defaultProgress();
        }

        const parsed = JSON.parse(data) as Partial<UserProgress>;
        return {
            currentLevel: parsed.currentLevel || 'A1',
            learnedWords: parsed.learnedWords || {},
            lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
    } catch (error) {
        return defaultProgress();
    }
};

export const saveLocalProgress = async (progress: Partial<UserProgress>): Promise<void> => {
    try {
        const existing = await getLocalProgress();
        const next: UserProgress = {
            ...existing,
            ...progress,
            learnedWords: progress.learnedWords ?? existing.learnedWords,
            lastUpdated: new Date().toISOString(),
        };

        await AsyncStorage.setItem(LOCAL_KEYS.USER_PROGRESS, JSON.stringify(next));
        await markAsUnsynced();
    } catch (error) {
        console.error('Error saving local progress:', error);
    }
};

// Mark as needing sync
export const markAsUnsynced = async (): Promise<void> => {
    try {
        await AsyncStorage.setItem(LOCAL_KEYS.SYNC_FLAG, 'true');
    } catch (error) {
        console.error('Error marking as unsynced:', error);
    }
};

// Check if needs sync
export const needsSync = async (): Promise<boolean> => {
    try {
        const flag = await AsyncStorage.getItem(LOCAL_KEYS.SYNC_FLAG);
        return flag === 'true';
    } catch (error) {
        return false;
    }
};

// Clear sync flag
export const clearSyncFlag = async (): Promise<void> => {
    try {
        await AsyncStorage.setItem(LOCAL_KEYS.SYNC_FLAG, 'false');
    } catch (error) {
        console.error('Error clearing sync flag:', error);
    }
};

// Get last sync time
export const getLastSyncTime = async (): Promise<Date | null> => {
    try {
        const data = await AsyncStorage.getItem(LOCAL_KEYS.LAST_SYNC);
        return data ? new Date(data) : null;
    } catch (error) {
        return null;
    }
};

// Set last sync time
export const setLastSyncTime = async (): Promise<void> => {
    try {
        await AsyncStorage.setItem(LOCAL_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
        console.error('Error setting last sync time:', error);
    }
};

// Save user data locally
export const saveUserDataLocally = async (userData: UserData): Promise<void> => {
    try {
        await AsyncStorage.setItem(LOCAL_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
        console.error('Error saving user data locally:', error);
    }
};

// Get local user data
export const getLocalUserData = async (): Promise<UserData | null> => {
    try {
        const data = await AsyncStorage.getItem(LOCAL_KEYS.USER_DATA);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        return null;
    }
};

// Clear all local data (for logout or language change)
export const clearAllLocalData = async (
    options: ClearAllLocalDataOptions = {}
): Promise<void> => {
    try {
        // Get all keys to find shuffle order caches
        const allKeys = await AsyncStorage.getAllKeys();
        const { preserveStreak = false, fullPurge = false } = options;

        // Keys to remove: all known storage keys (from centralized storageKeys)
        const keysToRemove = [
            LOCAL_KEYS.USER_PROGRESS,
            LOCAL_KEYS.SYNC_FLAG,
            LOCAL_KEYS.LAST_SYNC,
            LOCAL_KEYS.USER_DATA,
            // Progress service keys
            STORAGE_KEYS.PROGRESS,
            STORAGE_KEYS.SKIPPED,
            STORAGE_KEYS.CURRENT_LEVEL,
            STORAGE_KEYS.LAST_WORD_ID,
            // Vocabulary and Language keys (legacy monolith + per-level)
            STORAGE_KEYS.VOCABULARY,
            STORAGE_KEYS.NATIVE_LANGUAGE,
            STORAGE_KEYS.TARGET_LANGUAGE,
            STORAGE_KEYS.VOCABULARY_SCHEMA_VERSION,
            ...allKeys.filter(key => key.startsWith(STORAGE_KEYS.VOCABULARY_LEVEL_PREFIX)),
            STORAGE_KEYS.USER_LEVEL,
            // Notification keys
            STORAGE_KEYS.NOTIFICATION_SETTINGS,
            STORAGE_KEYS.PENDING_NOTIFICATION_WORD,
            STORAGE_KEYS.TRACKED_NOTIFICATIONS,
            STORAGE_KEYS.LAST_FOREGROUND_TIME,
            STORAGE_KEYS.LAST_BACKGROUND_TIME,
            STORAGE_KEYS.NOTIFICATION_CONTENT_VERSION,
            ...allKeys.filter(key => key.startsWith(STORAGE_KEYS.NOTIFICATION_PERMISSION_PROMPT_PREFIX)),
            // Grammar cache
            STORAGE_KEYS.GRAMMAR_CACHE,
            // i18n language preference
            STORAGE_KEYS.USER_LANGUAGE,
            // App review prompt state
            STORAGE_KEYS.APP_REVIEW_PROMPT_STATE,
            // User profile cache
            ...allKeys.filter(key => key.startsWith(STORAGE_KEYS.PROFILE_PREFIX)),
            // Add all shuffle order keys
            ...allKeys.filter(key => key.startsWith(STORAGE_KEYS.SHUFFLE_ORDER_PREFIX)),
            // Add all favorites keys (generic and user-specific)
            ...allKeys.filter(key => key.startsWith(STORAGE_KEYS.FAVORITES_PREFIX)),
        ];

        if (!preserveStreak) {
            keysToRemove.push(STORAGE_KEYS.STREAK);
        }

        if (fullPurge) {
            keysToRemove.push(LOCAL_KEYS.DEVICE_ID);
        }

        await AsyncStorage.multiRemove([...new Set(keysToRemove)]);
        console.log('Cleared all local data including shuffle order caches');
    } catch (error) {
        console.error('Error clearing local data:', error);
    }
};

// Get or create a unique device ID for this installation
export const getDeviceId = async (): Promise<string> => {
    try {
        let deviceId = await AsyncStorage.getItem(LOCAL_KEYS.DEVICE_ID);
        if (!deviceId) {
            // Generate a new device ID (simple UUID-like string)
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
            await AsyncStorage.setItem(LOCAL_KEYS.DEVICE_ID, deviceId);
            console.log('[Storage] Generated new device ID:', deviceId);
        }
        return deviceId;
    } catch (error) {
        console.error('Error getting device ID:', error);
        return 'unknown_device';
    }
};
