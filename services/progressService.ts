/**
 * Progress Service
 * 
 * Tracks user's learning progress across vocabulary levels.
 * Stores learned word IDs and handles level progression.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Level, LEVELS, getStoredVocabulary } from './vocabularyService';
import { markAsUnsynced } from './storage';
import { STORAGE_KEYS } from './storageKeys';

const PROGRESS_KEY = STORAGE_KEYS.PROGRESS;
const CURRENT_LEVEL_KEY = STORAGE_KEYS.CURRENT_LEVEL;
const LAST_WORD_ID_KEY = STORAGE_KEYS.LAST_WORD_ID;

export interface UserProgress {
    [level: string]: number[]; // Array of learned word IDs per level
}

/**
 * Get all user progress
 */
export async function getUserProgress(): Promise<UserProgress> {
    try {
        const data = await AsyncStorage.getItem(PROGRESS_KEY);
        if (data) {
            return JSON.parse(data);
        }
        return {};
    } catch (error) {
        console.error('Error loading progress:', error);
        return {};
    }
}

/**
 * Save user progress
 */
async function saveUserProgress(progress: UserProgress): Promise<void> {
    try {
        await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
        // Mark as needing sync to Firebase
        await markAsUnsynced();
    } catch (error) {
        console.error('Error saving progress:', error);
    }
}

/**
 * Get learned word IDs for a specific level
 */
export async function getLearnedWords(level: Level): Promise<number[]> {
    const progress = await getUserProgress();
    return progress[level] || [];
}

/**
 * Mark a word as learned
 */
export async function markWordAsLearned(level: Level, wordId: number): Promise<void> {
    const progress = await getUserProgress();

    if (!progress[level]) {
        progress[level] = [];
    }

    // Add word ID if not already learned
    if (!progress[level].includes(wordId)) {
        progress[level].push(wordId);
        await saveUserProgress(progress);
    }
}

/**
 * Unmark a word (mark as not learned)
 */
export async function unmarkWord(level: Level, wordId: number): Promise<void> {
    const progress = await getUserProgress();

    if (progress[level]) {
        progress[level] = progress[level].filter(id => id !== wordId);
        await saveUserProgress(progress);
    }
}

/**
 * Get count of learned words for a level
 */
export async function getLearnedCount(level: Level): Promise<number> {
    const learned = await getLearnedWords(level);
    return learned.length;
}

/**
 * Get total words count for a level
 */
export async function getTotalWords(level: Level): Promise<number> {
    const vocabulary = await getStoredVocabulary(level);
    return vocabulary.length;
}

/**
 * Check if a level is complete (all words learned)
 */
export async function isLevelComplete(level: Level): Promise<boolean> {
    const learnedCount = await getLearnedCount(level);
    const totalWords = await getTotalWords(level);

    return totalWords > 0 && learnedCount >= totalWords;
}

/**
 * Get progress percentage for a level
 */
export async function getLevelProgress(level: Level): Promise<number> {
    const learnedCount = await getLearnedCount(level);
    const totalWords = await getTotalWords(level);

    if (totalWords === 0) return 0;
    return Math.round((learnedCount / totalWords) * 100);
}

/**
 * Get or set current active level
 */
export async function getCurrentLevel(): Promise<Level> {
    try {
        const level = await AsyncStorage.getItem(CURRENT_LEVEL_KEY);
        if (level && LEVELS.includes(level as Level)) {
            return level as Level;
        }
        return 'A1';
    } catch (error) {
        console.error('Error getting current level:', error);
        return 'A1';
    }
}

export async function setCurrentLevel(level: Level): Promise<void> {
    try {
        await AsyncStorage.setItem(CURRENT_LEVEL_KEY, level);
    } catch (error) {
        console.error('Error setting current level:', error);
    }
}

/**
 * Move to next level if current is complete
 */
export async function checkAndAdvanceLevel(): Promise<Level> {
    const currentLevel = await getCurrentLevel();
    const isComplete = await isLevelComplete(currentLevel);

    if (isComplete) {
        const currentIndex = LEVELS.indexOf(currentLevel);
        if (currentIndex < LEVELS.length - 1) {
            const nextLevel = LEVELS[currentIndex + 1];
            await setCurrentLevel(nextLevel);
            return nextLevel;
        }
    }

    return currentLevel;
}

/**
 * Reset all progress
 */
export async function resetProgress(): Promise<void> {
    try {
        await AsyncStorage.removeItem(PROGRESS_KEY);
        await AsyncStorage.removeItem(CURRENT_LEVEL_KEY);
        await AsyncStorage.removeItem(LAST_WORD_ID_KEY);
        console.log('Progress reset successfully (including last word)');
    } catch (error) {
        console.error('Error resetting progress:', error);
    }
}

/**
 * Get unlearned words for a level (excluding already learned)
 */
export async function getUnlearnedWords(level: Level): Promise<number[]> {
    const vocabulary = await getStoredVocabulary(level);
    const learnedIds = await getLearnedWords(level);

    return vocabulary
        .filter(word => !learnedIds.includes(word.id))
        .map(word => word.id);
}

/**
 * Get overall progress stats
 */
export async function getOverallStats(): Promise<{
    totalLearned: number;
    totalWords: number;
    percentage: number;
    completedLevels: Level[];
}> {
    let totalLearned = 0;
    let totalWords = 0;
    const completedLevels: Level[] = [];

    for (const level of LEVELS) {
        const learned = await getLearnedCount(level);
        const total = await getTotalWords(level);

        totalLearned += learned;
        totalWords += total;

        if (total > 0 && learned >= total) {
            completedLevels.push(level);
        }
    }

    const percentage = totalWords > 0 ? Math.round((totalLearned / totalWords) * 100) : 0;

    return {
        totalLearned,
        totalWords,
        percentage,
        completedLevels,
    };
}

/**
 * Restore progress from Firebase data
 * Called when user logs in to sync Firebase progress to local storage
 */
export async function restoreProgressFromFirebase(
    learnedWords: { [level: string]: number[] } | null,
    currentLevel: string | null,
    lastWordIndex?: number | null
): Promise<void> {
    try {
        // Restore learned words
        if (learnedWords && typeof learnedWords === 'object') {
            await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(learnedWords));
            console.log('Restored learned words from Firebase:', Object.keys(learnedWords).length, 'levels');
        }

        // Restore current level
        if (currentLevel) {
            await AsyncStorage.setItem(CURRENT_LEVEL_KEY, currentLevel);
            console.log('Restored current level from Firebase:', currentLevel);
        }

        // Restore last word ID
        if (lastWordIndex !== undefined && lastWordIndex !== null) {
            await AsyncStorage.setItem(LAST_WORD_ID_KEY, lastWordIndex.toString());
            console.log('Restored last word ID from Firebase:', lastWordIndex);
        }
    } catch (error) {
        console.error('Error restoring progress from Firebase:', error);
    }
}

// ============ LAST WORD ID ============

/**
 * Save the last viewed word ID (for resuming from same word after shuffle)
 */
export async function saveLastWordId(wordId: number): Promise<void> {
    try {
        await AsyncStorage.setItem(LAST_WORD_ID_KEY, wordId.toString());
        await markAsUnsynced();
    } catch (error) {
        console.error('Error saving last word ID:', error);
    }
}

/**
 * Get the last viewed word ID
 */
export async function getLastWordId(): Promise<number | null> {
    try {
        const data = await AsyncStorage.getItem(LAST_WORD_ID_KEY);
        return data ? parseInt(data, 10) : null;
    } catch (error) {
        console.error('Error getting last word ID:', error);
        return null;
    }
}

// Keep old functions for backward compatibility (but deprecated)
export async function saveLastWordIndex(index: number): Promise<void> {
    await saveLastWordId(index);
}

export async function getLastWordIndex(): Promise<number> {
    const id = await getLastWordId();
    return id || 0;
}
