/**
 * Vocabulary Service
 * 
 * Manages vocabulary data loading and storage for language learning.
 * Uses LEVEL-BASED files for better performance (e.g., english_A1.json)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
// @ts-ignore - expo-file-system/legacy is valid in SDK 54 but typescript might not know it yet
import * as FileSystem from 'expo-file-system/legacy';
import { STORAGE_KEYS } from './storageKeys';

// Vocabulary assets organized by language.
// NOTE: Vocabulary files are stored as text assets (JSON content) to avoid Metro bundling/parsing
// huge JSON modules during development.
const VOCABULARY_ASSETS: Record<string, Partial<Record<Level, number>>> = {
    english: {
        A1: require('../assets/vocabulary/english_A1.txt'),
        A2: require('../assets/vocabulary/english_A2.txt'),
        B1: require('../assets/vocabulary/english_B1.txt'),
        B2: require('../assets/vocabulary/english_B2.txt'),
        C1: require('../assets/vocabulary/english_C1.txt'),
    },
    turkish: {
        A1: require('../assets/vocabulary/turkish_A1.txt'),
        A2: require('../assets/vocabulary/turkish_A2.txt'),
        B1: require('../assets/vocabulary/turkish_B1.txt'),
        B2: require('../assets/vocabulary/turkish_B2.txt'),
        C1: require('../assets/vocabulary/turkish_C1.txt'),
    },
    german: {
        A1: require('../assets/vocabulary/german_A1.txt'),
        A2: require('../assets/vocabulary/german_A2.txt'),
        B1: require('../assets/vocabulary/german_B1.txt'),
        B2: require('../assets/vocabulary/german_B2.txt'),
        C1: require('../assets/vocabulary/german_C1.txt'),
    },
    french: {
        A1: require('../assets/vocabulary/french_A1.txt'),
        A2: require('../assets/vocabulary/french_A2.txt'),
        B1: require('../assets/vocabulary/french_B1.txt'),
        B2: require('../assets/vocabulary/french_B2.txt'),
        C1: require('../assets/vocabulary/french_C1.txt'),
    },
    spanish: {
        A1: require('../assets/vocabulary/spanish_A1.txt'),
        A2: require('../assets/vocabulary/spanish_A2.txt'),
        B1: require('../assets/vocabulary/spanish_B1.txt'),
        B2: require('../assets/vocabulary/spanish_B2.txt'),
        C1: require('../assets/vocabulary/spanish_C1.txt'),
    },
    italian: {
        A1: require('../assets/vocabulary/italian_A1.txt'),
        A2: require('../assets/vocabulary/italian_A2.txt'),
        B1: require('../assets/vocabulary/italian_B1.txt'),
        B2: require('../assets/vocabulary/italian_B2.txt'),
        C1: require('../assets/vocabulary/italian_C1.txt'),
    },
    portuguese: {
        A1: require('../assets/vocabulary/portuguese_A1.txt'),
        A2: require('../assets/vocabulary/portuguese_A2.txt'),
        B1: require('../assets/vocabulary/portuguese_B1.txt'),
        B2: require('../assets/vocabulary/portuguese_B2.txt'),
        C1: require('../assets/vocabulary/portuguese_C1.txt'),
    },
    russian: {
        A1: require('../assets/vocabulary/russian_A1.txt'),
        A2: require('../assets/vocabulary/russian_A2.txt'),
        B1: require('../assets/vocabulary/russian_B1.txt'),
        B2: require('../assets/vocabulary/russian_B2.txt'),
        C1: require('../assets/vocabulary/russian_C1.txt'),
    },
    japanese: {
        A1: require('../assets/vocabulary/japanese_A1.txt'),
        A2: require('../assets/vocabulary/japanese_A2.txt'),
        B1: require('../assets/vocabulary/japanese_B1.txt'),
        B2: require('../assets/vocabulary/japanese_B2.txt'),
        C1: require('../assets/vocabulary/japanese_C1.txt'),
    },
    korean: {
        A1: require('../assets/vocabulary/korean_A1.txt'),
        A2: require('../assets/vocabulary/korean_A2.txt'),
        B1: require('../assets/vocabulary/korean_B1.txt'),
        B2: require('../assets/vocabulary/korean_B2.txt'),
        C1: require('../assets/vocabulary/korean_C1.txt'),
    },
    chinese: {
        A1: require('../assets/vocabulary/chinese_A1.txt'),
        A2: require('../assets/vocabulary/chinese_A2.txt'),
        B1: require('../assets/vocabulary/chinese_B1.txt'),
        B2: require('../assets/vocabulary/chinese_B2.txt'),
        C1: require('../assets/vocabulary/chinese_C1.txt'),
    },
    arabic: {
        A1: require('../assets/vocabulary/arabic_A1.txt'),
        A2: require('../assets/vocabulary/arabic_A2.txt'),
        B1: require('../assets/vocabulary/arabic_B1.txt'),
        B2: require('../assets/vocabulary/arabic_B2.txt'),
        C1: require('../assets/vocabulary/arabic_C1.txt'),
    },
    hindi: {
        A1: require('../assets/vocabulary/hindi_A1.txt'),
        A2: require('../assets/vocabulary/hindi_A2.txt'),
        B1: require('../assets/vocabulary/hindi_B1.txt'),
        B2: require('../assets/vocabulary/hindi_B2.txt'),
        C1: require('../assets/vocabulary/hindi_C1.txt'),
    },
    indonesian: {
        A1: require('../assets/vocabulary/indonesian_A1.txt'),
        A2: require('../assets/vocabulary/indonesian_A2.txt'),
        B1: require('../assets/vocabulary/indonesian_B1.txt'),
        B2: require('../assets/vocabulary/indonesian_B2.txt'),
        C1: require('../assets/vocabulary/indonesian_C1.txt'),
    },
    persian: {
        A1: require('../assets/vocabulary/persian_A1.txt'),
        A2: require('../assets/vocabulary/persian_A2.txt'),
        B1: require('../assets/vocabulary/persian_B1.txt'),
        B2: require('../assets/vocabulary/persian_B2.txt'),
        C1: require('../assets/vocabulary/persian_C1.txt'),
    },
    serbian: {
        A1: require('../assets/vocabulary/serbian_A1.txt'),
        A2: require('../assets/vocabulary/serbian_A2.txt'),
        B1: require('../assets/vocabulary/serbian_B1.txt'),
        B2: require('../assets/vocabulary/serbian_B2.txt'),
        C1: require('../assets/vocabulary/serbian_C1.txt'),
    },
    swahili: {
        A1: require('../assets/vocabulary/swahili_A1.txt'),
        A2: require('../assets/vocabulary/swahili_A2.txt'),
        B1: require('../assets/vocabulary/swahili_B1.txt'),
        B2: require('../assets/vocabulary/swahili_B2.txt'),
        C1: require('../assets/vocabulary/swahili_C1.txt'),
    },
    thai: {
        A1: require('../assets/vocabulary/thai_A1.txt'),
        A2: require('../assets/vocabulary/thai_A2.txt'),
        B1: require('../assets/vocabulary/thai_B1.txt'),
        B2: require('../assets/vocabulary/thai_B2.txt'),
        C1: require('../assets/vocabulary/thai_C1.txt'),
    },
    urdu: {
        A1: require('../assets/vocabulary/urdu_A1.txt'),
        A2: require('../assets/vocabulary/urdu_A2.txt'),
        B1: require('../assets/vocabulary/urdu_B1.txt'),
        B2: require('../assets/vocabulary/urdu_B2.txt'),
        C1: require('../assets/vocabulary/urdu_C1.txt'),
    },
    vietnamese: {
        A1: require('../assets/vocabulary/vietnamese_A1.txt'),
        A2: require('../assets/vocabulary/vietnamese_A2.txt'),
        B1: require('../assets/vocabulary/vietnamese_B1.txt'),
        B2: require('../assets/vocabulary/vietnamese_B2.txt'),
        C1: require('../assets/vocabulary/vietnamese_C1.txt'),
    },
    amharic: {
        A1: require('../assets/vocabulary/amharic_A1.txt'),
        A2: require('../assets/vocabulary/amharic_A2.txt'),
        B1: require('../assets/vocabulary/amharic_B1.txt'),
        B2: require('../assets/vocabulary/amharic_B2.txt'),
        C1: require('../assets/vocabulary/amharic_C1.txt'),
    },
};

// Cache for loaded vocabulary data
const vocabularyCache: { [key: string]: any } = {};

export interface VocabularyWord {
    id: number;
    word: string;           // Target language word
    translation: string;    // Native language word
    sentence1: string;      // Example sentence 1 (target)
    sentence2: string;      // Example sentence 2 (target)
    nativeSentence1: string; // Example sentence 1 (native)
    nativeSentence2: string; // Example sentence 2 (native)
}

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

// Map user level selection to actual CEFR levels
export function getLevelsForUserLevel(userLevel: string): Level[] {
    switch (userLevel) {
        case 'beginner':
            return ['A1', 'A2'];
        case 'intermediate':
            return ['B1', 'B2'];
        case 'advanced':
            return ['C1'];
        default:
            return ['A1', 'A2'];
    }
}

// Get the first level for a user level
export function getFirstLevelForUserLevel(userLevel: string): Level {
    const levels = getLevelsForUserLevel(userLevel);
    return levels[0];
}

async function loadLevelVocabularyData(language: string, level: Level): Promise<any> {
    const cacheKey = `${language}_${level}`;

    if (vocabularyCache[cacheKey]) {
        return vocabularyCache[cacheKey];
    }

    const moduleId = VOCABULARY_ASSETS[language]?.[level];
    if (!moduleId) {
        console.warn(`No vocabulary asset for ${language}_${level}`);
        return null;
    }

    try {
        const asset = Asset.fromModule(moduleId);
        await asset.downloadAsync();
        const uri = asset.localUri ?? asset.uri;
        const raw = await FileSystem.readAsStringAsync(uri);
        const data = JSON.parse(raw);
        vocabularyCache[cacheKey] = data;
        return data;
    } catch (error) {
        console.error(`Error loading vocabulary for ${language}_${level}:`, error);
        return null;
    }
}

/**
 * Get vocabulary data for a specific language and level
 */
export async function getLanguageVocabulary(
    language: string,
    level: Level
): Promise<VocabularyWord[] | null> {
    const data = await loadLevelVocabularyData(language, level);
    if (!data || !data.words) {
        console.warn(`No vocabulary data for ${language}_${level}`);
        return null;
    }
    return data.words;
}

/**
 * Merge native and target language vocabulary
 */
export async function mergeVocabulary(
    nativeLanguage: string,
    targetLanguage: string,
    level: Level
): Promise<VocabularyWord[]> {
    const [targetWords, nativeWords] = await Promise.all([
        getLanguageVocabulary(targetLanguage, level),
        getLanguageVocabulary(nativeLanguage, level),
    ]);

    if (!targetWords) {
        console.warn(`No target vocabulary for ${targetLanguage}_${level}`);
        return [];
    }

    if (!nativeWords) {
        console.warn(`No native vocabulary for ${nativeLanguage}_${level}`);
        return targetWords.map(word => ({
            ...word,
            translation: word.word,
            nativeSentence1: word.sentence1,
            nativeSentence2: word.sentence2,
        }));
    }

    // Build a lookup map by word ID for O(1) matching (instead of index-based merge)
    const nativeById = new Map<number, VocabularyWord>();
    for (const nw of nativeWords) {
        nativeById.set(nw.id, nw);
    }

    const mergedWords: VocabularyWord[] = [];

    for (const targetWord of targetWords) {
        const nativeWord = nativeById.get(targetWord.id);

        mergedWords.push({
            id: targetWord.id,
            word: targetWord.word,
            translation: nativeWord ? nativeWord.word : targetWord.word,
            sentence1: targetWord.sentence1,
            sentence2: targetWord.sentence2,
            nativeSentence1: nativeWord ? nativeWord.sentence1 : targetWord.sentence1,
            nativeSentence2: nativeWord ? nativeWord.sentence2 : targetWord.sentence2,
        });
    }

    return mergedWords;
}

// Storage keys (centralized via storageKeys.ts)
const VOCABULARY_KEY = STORAGE_KEYS.VOCABULARY;
const NATIVE_LANGUAGE_KEY = STORAGE_KEYS.NATIVE_LANGUAGE;
const TARGET_LANGUAGE_KEY = STORAGE_KEYS.TARGET_LANGUAGE;

/**
 * Generate and store vocabulary for a user's language pair
 */
export async function generateVocabulary(
    nativeLanguage: string,
    targetLanguage: string
): Promise<void> {
    try {
        console.log(`Generating vocabulary: ${nativeLanguage} -> ${targetLanguage}`);

        await AsyncStorage.setItem(NATIVE_LANGUAGE_KEY, nativeLanguage);
        await AsyncStorage.setItem(TARGET_LANGUAGE_KEY, targetLanguage);

        const allVocabulary: { [level: string]: VocabularyWord[] } = {};

        for (const level of LEVELS) {
            const merged = await mergeVocabulary(nativeLanguage, targetLanguage, level);
            allVocabulary[level] = merged;
            console.log(`  ${level}: ${merged.length} words`);
        }

        await AsyncStorage.setItem(VOCABULARY_KEY, JSON.stringify(allVocabulary));
        console.log('Vocabulary saved to storage');
    } catch (error) {
        console.error('Error generating vocabulary:', error);
        throw error;
    }
}

/**
 * Get stored vocabulary for a specific level
 */
export async function getStoredVocabulary(level: Level): Promise<VocabularyWord[]> {
    try {
        const data = await AsyncStorage.getItem(VOCABULARY_KEY);
        if (!data) {
            console.warn('No stored vocabulary found');
            return [];
        }

        const vocabulary = JSON.parse(data);
        return vocabulary[level] || [];
    } catch (error) {
        console.error('Error getting stored vocabulary:', error);
        return [];
    }
}

/**
 * Check if vocabulary has been generated
 */
export async function isVocabularyGenerated(): Promise<boolean> {
    try {
        const data = await AsyncStorage.getItem(VOCABULARY_KEY);
        return data !== null;
    } catch (error) {
        console.error('Error checking vocabulary:', error);
        return false;
    }
}

/**
 * Get the stored language pair
 */
export async function getLanguagePair(): Promise<{ native: string; target: string } | null> {
    try {
        const native = await AsyncStorage.getItem(NATIVE_LANGUAGE_KEY);
        const target = await AsyncStorage.getItem(TARGET_LANGUAGE_KEY);

        if (native && target) {
            return { native, target };
        }
        return null;
    } catch (error) {
        console.error('Error getting language pair:', error);
        return null;
    }
}

/**
 * Shuffle an array randomly (Fisher-Yates algorithm)
 */
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Clear all vocabulary data
 */
export async function clearVocabulary(): Promise<void> {
    try {
        await AsyncStorage.removeItem(VOCABULARY_KEY);
        await AsyncStorage.removeItem(NATIVE_LANGUAGE_KEY);
        await AsyncStorage.removeItem(TARGET_LANGUAGE_KEY);
        console.log('Vocabulary cleared');
    } catch (error) {
        console.error('Error clearing vocabulary:', error);
    }
}
