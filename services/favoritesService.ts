/**
 * Favorites Service
 * 
 * Manages favorite words using AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { VocabularyWord } from './vocabularyService';

const FAVORITES_KEY = '@favorites';

/**
 * Get all favorite words
 */
export async function getFavorites(): Promise<VocabularyWord[]> {
    try {
        const data = await AsyncStorage.getItem(FAVORITES_KEY);
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
 * Add a word to favorites
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
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        console.log('Added to favorites:', word.word);
    } catch (error) {
        console.error('Error adding to favorites:', error);
    }
}

/**
 * Remove a word from favorites
 */
export async function removeFromFavorites(wordId: number): Promise<void> {
    try {
        const favorites = await getFavorites();
        const filtered = favorites.filter(fav => fav.id !== wordId);
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
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
 * Clear all favorites
 */
export async function clearFavorites(): Promise<void> {
    try {
        await AsyncStorage.removeItem(FAVORITES_KEY);
        console.log('Cleared all favorites');
    } catch (error) {
        console.error('Error clearing favorites:', error);
    }
}
