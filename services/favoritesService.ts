/**
 * Favorites Service
 * 
 * Manages favorite words using AsyncStorage and Firebase.
 * - Stores word IDs AND Level for uniqueness (e.g., {id: 1, level: 'A1'})
 * - Local storage is user-specific (uses user ID in key)
 * - Syncs to Firebase for cross-device access
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { VocabularyWord, getStoredVocabulary, LEVELS, Level } from './vocabularyService';
import { markAsUnsynced } from './storage';

export interface FavoriteItem {
    id: number;
    level: Level;
}

// Get user-specific key for favorites
const getFavoritesKey = (): string => {
    const userId = auth.currentUser?.uid;
    return userId ? `@favorites_${userId}` : '@favorites';
};

/**
 * Get all favorite items (ID + Level)
 * Handles migration from old format (number[]) on the fly
 */
export async function getFavoriteItems(): Promise<FavoriteItem[]> {
    try {
        const key = getFavoritesKey();
        const data = await AsyncStorage.getItem(key);

        if (!data) return [];

        const parsed = JSON.parse(data);

        if (!Array.isArray(parsed)) return [];

        if (parsed.length === 0) return [];

        // Check if old format (number[])
        if (typeof parsed[0] === 'number') {
            console.log('Migrating legacy favorites to level-aware format...');
            const migrated: FavoriteItem[] = [];

            // For each legacy ID, we must assume it could be in ANY level
            // This is the safest bet to not lose data. User can remove duplicates later.
            for (const id of parsed) {
                // Check which levels have this ID (to avoid adding non-existent words)
                for (const level of LEVELS) {
                    const vocab = await getStoredVocabulary(level);
                    if (vocab.find(w => w.id === id)) {
                        migrated.push({ id, level });
                    }
                }
            }

            // Save migrated data immediately
            await AsyncStorage.setItem(key, JSON.stringify(migrated));
            return migrated;
        }

        return parsed as FavoriteItem[];
    } catch (error) {
        console.error('Error getting favorites:', error);
        return [];
    }
}

/**
 * Get all favorite words with full details
 * Retrieves word details from vocabulary based on stored IDs and Levels
 */
export async function getFavorites(): Promise<(VocabularyWord & { level: Level })[]> {
    try {
        const favoriteItems = await getFavoriteItems();
        if (favoriteItems.length === 0) return [];

        const result: (VocabularyWord & { level: Level })[] = [];

        // Group favorites by level for efficient loading
        const byLevel: Record<string, number[]> = {};
        favoriteItems.forEach(item => {
            if (!byLevel[item.level]) byLevel[item.level] = [];
            byLevel[item.level].push(item.id);
        });

        // Load vocabulary for levels that have favorites
        for (const levelStr in byLevel) {
            const level = levelStr as Level;
            const ids = byLevel[level];

            const levelWords = await getStoredVocabulary(level);

            const matchingWords = levelWords
                .filter(w => ids.includes(w.id))
                .map(w => ({ ...w, level }));

            result.push(...matchingWords);
        }

        return result;
    } catch (error) {
        console.error('Error getting favorites with details:', error);
        return [];
    }
}

/**
 * Add a word to favorites (local only)
 * Firebase sync happens daily or on logout
 */
export async function addToFavorites(word: VocabularyWord, level: Level): Promise<void> {
    try {
        const favoriteItems = await getFavoriteItems();

        // Check if already exists (check both ID and Level)
        const exists = favoriteItems.some(item => item.id === word.id && item.level === level);
        if (exists) {
            console.log('Word already in favorites');
            return;
        }

        // Add new favorite
        favoriteItems.push({ id: word.id, level });

        const key = getFavoritesKey();
        await AsyncStorage.setItem(key, JSON.stringify(favoriteItems));
        await markAsUnsynced();

        console.log('Added to favorites:', word.word, `(${level})`);
    } catch (error) {
        console.error('Error adding to favorites:', error);
    }
}

/**
 * Remove a word from favorites (local only)
 * Firebase sync happens daily or on logout
 */
export async function removeFromFavorites(wordId: number, level?: Level): Promise<void> {
    try {
        const favoriteItems = await getFavoriteItems();

        let filtered: FavoriteItem[];

        if (level) {
            // Remove specific word from specific level
            filtered = favoriteItems.filter(item => !(item.id === wordId && item.level === level));
        } else {
            // Legacy support: remove by ID only (removes from all levels)
            filtered = favoriteItems.filter(item => item.id !== wordId);
        }

        const key = getFavoritesKey();
        await AsyncStorage.setItem(key, JSON.stringify(filtered));
        await markAsUnsynced();

        console.log('Removed from favorites');
    } catch (error) {
        console.error('Error removing from favorites:', error);
    }
}

/**
 * Check if a word is in favorites
 */
export async function isFavorite(wordId: number, level: Level): Promise<boolean> {
    try {
        const favoriteItems = await getFavoriteItems();
        return favoriteItems.some(item => item.id === wordId && item.level === level);
    } catch (error) {
        console.error('Error checking favorite:', error);
        return false;
    }
}

/**
 * Clear all favorites (local only)
 * Firebase sync happens daily or on logout
 */
export async function clearFavorites(): Promise<void> {
    try {
        const key = getFavoritesKey();
        await AsyncStorage.removeItem(key);
        await markAsUnsynced();

        console.log('Cleared all favorites');
    } catch (error) {
        console.error('Error clearing favorites:', error);
    }
}

/**
 * Clear favorites on Firebase (explicitly with user ID)
 * Use this when resetting/changing language to ensure Firebase data is cleared
 * even if auth.currentUser is not available
 */
export async function clearFavoritesOnFirebase(userId: string): Promise<void> {
    try {
        if (!userId) return;

        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { favorites: [] }, { merge: true });

        console.log('Cleared favorites on Firebase for user:', userId);
    } catch (error) {
        console.error('Error clearing favorites on Firebase:', error);
    }
}

/**
 * Sync favorites to Firebase
 * Called by SyncService during daily sync or logout
 */
export async function syncFavoritesToFirebase(): Promise<void> {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const favoriteItems = await getFavoriteItems();
        const userRef = doc(db, 'users', userId);

        // Save as array of objects
        await setDoc(userRef, {
            favorites: favoriteItems,
        }, { merge: true });

        console.log('Favorites synced to Firebase:', favoriteItems.length, 'items');
    } catch (error) {
        console.error('Error syncing favorites to Firebase:', error);
    }
}

/**
 * Restore favorites from Firebase (on login)
 */
export async function restoreFavoritesFromFirebase(): Promise<void> {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.favorites && Array.isArray(data.favorites)) {
                const key = getFavoritesKey();

                // Validate/Normalize data
                // If it's old format (numbers), getFavoriteItems will handle it on next read
                // But if we're restoring, we might want to store it as is first
                let itemsToStore = data.favorites;

                await AsyncStorage.setItem(key, JSON.stringify(itemsToStore));
                console.log('Favorites restored from Firebase:', itemsToStore.length, 'items');
            }
        }
    } catch (error) {
        console.error('Error restoring favorites from Firebase:', error);
    }
}

/**
 * Export for backward compatibility (maps to getFavoriteItems ids)
 * @deprecated Use getFavoriteItems instead
 */
export async function getFavoriteIds(): Promise<number[]> {
    const items = await getFavoriteItems();
    // Return unique IDs for backward compat if needed (though level is missing)
    return [...new Set(items.map(i => i.id))];
}
