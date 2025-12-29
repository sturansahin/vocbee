/**
 * Favorites Service
 * 
 * Manages favorite words using AsyncStorage and Firebase.
 * - Local storage is user-specific (uses user ID in key)
 * - Syncs to Firebase for cross-device access
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { VocabularyWord } from './vocabularyService';

// Get user-specific key for favorites
const getFavoritesKey = (): string => {
    const userId = auth.currentUser?.uid;
    return userId ? `@favorites_${userId}` : '@favorites';
};

/**
 * Get all favorite words
 */
export async function getFavorites(): Promise<VocabularyWord[]> {
    try {
        const key = getFavoritesKey();
        const data = await AsyncStorage.getItem(key);
        if (data) {
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Error getting favorites:', error);
        return [];
    }
}

/**
 * Add a word to favorites (local + Firebase)
 */
export async function addToFavorites(word: VocabularyWord): Promise<void> {
    try {
        const favorites = await getFavorites();

        // Check if already exists
        const exists = favorites.some(fav => fav.id === word.id);
        if (exists) {
            console.log('Word already in favorites');
            return;
        }

        // Add new favorite
        favorites.push(word);
        const key = getFavoritesKey();
        await AsyncStorage.setItem(key, JSON.stringify(favorites));

        // Sync to Firebase
        await syncFavoritesToFirebase(favorites);

        console.log('Added to favorites:', word.word);
    } catch (error) {
        console.error('Error adding to favorites:', error);
    }
}

/**
 * Remove a word from favorites (local + Firebase)
 */
export async function removeFromFavorites(wordId: number): Promise<void> {
    try {
        const favorites = await getFavorites();
        const filtered = favorites.filter(fav => fav.id !== wordId);
        const key = getFavoritesKey();
        await AsyncStorage.setItem(key, JSON.stringify(filtered));

        // Sync to Firebase
        await syncFavoritesToFirebase(filtered);

        console.log('Removed from favorites');
    } catch (error) {
        console.error('Error removing from favorites:', error);
    }
}

/**
 * Check if a word is in favorites
 */
export async function isFavorite(wordId: number): Promise<boolean> {
    try {
        const favorites = await getFavorites();
        return favorites.some(fav => fav.id === wordId);
    } catch (error) {
        console.error('Error checking favorite:', error);
        return false;
    }
}

/**
 * Clear all favorites (local + Firebase)
 */
export async function clearFavorites(): Promise<void> {
    try {
        const key = getFavoritesKey();
        await AsyncStorage.removeItem(key);

        // Sync to Firebase
        await syncFavoritesToFirebase([]);

        console.log('Cleared all favorites');
    } catch (error) {
        console.error('Error clearing favorites:', error);
    }
}

/**
 * Sync favorites to Firebase
 */
async function syncFavoritesToFirebase(favorites: VocabularyWord[]): Promise<void> {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            favorites: favorites.map(fav => ({
                id: fav.id,
                word: fav.word,
                translation: fav.translation,
            })),
        }, { merge: true });

        console.log('Favorites synced to Firebase');
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
                await AsyncStorage.setItem(key, JSON.stringify(data.favorites));
                console.log('Favorites restored from Firebase:', data.favorites.length, 'items');
            }
        }
    } catch (error) {
        console.error('Error restoring favorites from Firebase:', error);
    }
}
