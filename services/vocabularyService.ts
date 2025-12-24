/**
 * Vocabulary Service
 * 
 * Manages vocabulary data loading and storage for language learning.
 * Combines native and target language data for flashcard display.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Vocabulary loaders - each loader is invoked only when needed
// This prevents Metro from bundling all JSON files at startup
const getVocabularyLoader = (language: string): (() => any) | null => {
    switch (language) {
        case 'amharic': return () => require('../assets/vocabulary/amharic.json');
        case 'arabic': return () => require('../assets/vocabulary/arabic.json');
        case 'chinese': return () => require('../assets/vocabulary/chinese.json');
        case 'english': return () => require('../assets/vocabulary/english.json');
        case 'french': return () => require('../assets/vocabulary/french.json');
        case 'german': return () => require('../assets/vocabulary/german.json');
        case 'hindi': return () => require('../assets/vocabulary/hindi.json');
        case 'indonesian': return () => require('../assets/vocabulary/indonesian.json');
        case 'italian': return () => require('../assets/vocabulary/italian.json');
        case 'japanese': return () => require('../assets/vocabulary/japanese.json');
        case 'korean': return () => require('../assets/vocabulary/korean.json');
        case 'persian': return () => require('../assets/vocabulary/persian.json');
        case 'portuguese': return () => require('../assets/vocabulary/portuguese.json');
        case 'russian': return () => require('../assets/vocabulary/russian.json');
        case 'serbian': return () => require('../assets/vocabulary/serbian.json');
        case 'spanish': return () => require('../assets/vocabulary/spanish.json');
        case 'swahili': return () => require('../assets/vocabulary/swahili.json');
        case 'thai': return () => require('../assets/vocabulary/thai.json');
        case 'turkish': return () => require('../assets/vocabulary/turkish.json');
        case 'urdu': return () => require('../assets/vocabulary/urdu.json');
        case 'vietnamese': return () => require('../assets/vocabulary/vietnamese.json');
        default: return null;
    }
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

/**
 * Load vocabulary data for a language (lazy loaded)
 */
function loadVocabularyData(language: string): any {
    if (vocabularyCache[language]) {
        return vocabularyCache[language];
    }

    const loader = getVocabularyLoader(language);
    if (!loader) {
        console.warn(`No vocabulary loader for ${language}`);
        return null;
    }

    try {
        const data = loader();
        vocabularyCache[language] = data;
        return data;
    } catch (error) {
        console.error(`Error loading vocabulary for ${language}:`, error);
        return null;
    }
}

/**
 * Get vocabulary data for a specific language and level
 */
export function getLanguageVocabulary(language: string, level: Level): VocabularyWord[] | null {
    const data = loadVocabularyData(language);
    if (!data || !data[level]) {
        console.warn(`No vocabulary data for ${language} - ${level}`);
        return null;
    }
    return data[level].words;
}

/**
 * Merge native and target language vocabulary
 * Creates a combined vocabulary with words from target language and translations from native
 */
export function mergeVocabulary(
    nativeLanguage: string,
    targetLanguage: string,
    level: Level
): VocabularyWord[] {
    const targetWords = getLanguageVocabulary(targetLanguage, level);
    const nativeWords = getLanguageVocabulary(nativeLanguage, level);

    if (!targetWords) {
        console.warn(`No target vocabulary for ${targetLanguage} - ${level}`);
        return [];
    }

    if (!nativeWords) {
        console.warn(`No native vocabulary for ${nativeLanguage} - ${level}`);
        // Return target words without translation
        return targetWords.map(word => ({
            ...word,
            translation: word.word,
            nativeSentence1: word.sentence1,
            nativeSentence2: word.sentence2,
        }));
    }

    // Merge words by index (they should have matching IDs)
    const mergedWords: VocabularyWord[] = [];

    for (let i = 0; i < targetWords.length && i < nativeWords.length; i++) {
        const targetWord = targetWords[i];
        const nativeWord = nativeWords[i];

        mergedWords.push({
            id: targetWord.id,
            word: targetWord.word,
            translation: nativeWord.word,
            sentence1: targetWord.sentence1,
            sentence2: targetWord.sentence2,
            nativeSentence1: nativeWord.sentence1,
            nativeSentence2: nativeWord.sentence2,
        });
    }

    return mergedWords;
}

/**
 * Generate and save all level vocabularies for a language pair
 */
export async function generateAllVocabulary(
    nativeLanguage: string,
    targetLanguage: string
): Promise<void> {
    console.log(`Generating vocabulary: ${nativeLanguage} -> ${targetLanguage}`);

    for (const level of LEVELS) {
        const vocabulary = mergeVocabulary(nativeLanguage, targetLanguage, level);
        const key = `@vocabulary_${level}`;

        try {
            await AsyncStorage.setItem(key, JSON.stringify(vocabulary));
            console.log(`Saved ${vocabulary.length} words for ${level}`);
        } catch (error) {
            console.error(`Error saving vocabulary for ${level}:`, error);
        }
    }

    // Save language settings
    await AsyncStorage.setItem('@native_language', nativeLanguage);
    await AsyncStorage.setItem('@target_language', targetLanguage);
}

/**
 * Get vocabulary for a specific level from storage
 */
export async function getStoredVocabulary(level: Level): Promise<VocabularyWord[]> {
    try {
        const key = `@vocabulary_${level}`;
        const data = await AsyncStorage.getItem(key);

        if (data) {
            return JSON.parse(data);
        }

        return [];
    } catch (error) {
        console.error(`Error loading vocabulary for ${level}:`, error);
        return [];
    }
}

/**
 * Get current language settings
 */
export async function getLanguageSettings(): Promise<{
    nativeLanguage: string | null;
    targetLanguage: string | null;
}> {
    const nativeLanguage = await AsyncStorage.getItem('@native_language');
    const targetLanguage = await AsyncStorage.getItem('@target_language');

    return { nativeLanguage, targetLanguage };
}

/**
 * Check if vocabulary is already generated
 */
export async function isVocabularyGenerated(): Promise<boolean> {
    const { nativeLanguage, targetLanguage } = await getLanguageSettings();
    if (!nativeLanguage || !targetLanguage) return false;

    const vocabulary = await getStoredVocabulary('A1');
    return vocabulary.length > 0;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
