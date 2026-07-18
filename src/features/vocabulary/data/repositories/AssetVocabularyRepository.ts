import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

import { STORAGE_KEYS } from '@shared/storage';

import { LEVELS, type Level, type VocabularyWord } from '../../domain/types';
import type { StoredVocabularyByLevel, VocabularyRepository } from '../contracts';

const VOCABULARY_ASSETS: Record<string, Partial<Record<Level, number>>> = {
  english: {
    A1: require('../../../../../assets/vocabulary/english_A1.txt'),
    A2: require('../../../../../assets/vocabulary/english_A2.txt'),
    B1: require('../../../../../assets/vocabulary/english_B1.txt'),
    B2: require('../../../../../assets/vocabulary/english_B2.txt'),
    C1: require('../../../../../assets/vocabulary/english_C1.txt'),
  },
  turkish: {
    A1: require('../../../../../assets/vocabulary/turkish_A1.txt'),
    A2: require('../../../../../assets/vocabulary/turkish_A2.txt'),
    B1: require('../../../../../assets/vocabulary/turkish_B1.txt'),
    B2: require('../../../../../assets/vocabulary/turkish_B2.txt'),
    C1: require('../../../../../assets/vocabulary/turkish_C1.txt'),
  },
  german: {
    A1: require('../../../../../assets/vocabulary/german_A1.txt'),
    A2: require('../../../../../assets/vocabulary/german_A2.txt'),
    B1: require('../../../../../assets/vocabulary/german_B1.txt'),
    B2: require('../../../../../assets/vocabulary/german_B2.txt'),
    C1: require('../../../../../assets/vocabulary/german_C1.txt'),
  },
  french: {
    A1: require('../../../../../assets/vocabulary/french_A1.txt'),
    A2: require('../../../../../assets/vocabulary/french_A2.txt'),
    B1: require('../../../../../assets/vocabulary/french_B1.txt'),
    B2: require('../../../../../assets/vocabulary/french_B2.txt'),
    C1: require('../../../../../assets/vocabulary/french_C1.txt'),
  },
  spanish: {
    A1: require('../../../../../assets/vocabulary/spanish_A1.txt'),
    A2: require('../../../../../assets/vocabulary/spanish_A2.txt'),
    B1: require('../../../../../assets/vocabulary/spanish_B1.txt'),
    B2: require('../../../../../assets/vocabulary/spanish_B2.txt'),
    C1: require('../../../../../assets/vocabulary/spanish_C1.txt'),
  },
  italian: {
    A1: require('../../../../../assets/vocabulary/italian_A1.txt'),
    A2: require('../../../../../assets/vocabulary/italian_A2.txt'),
    B1: require('../../../../../assets/vocabulary/italian_B1.txt'),
    B2: require('../../../../../assets/vocabulary/italian_B2.txt'),
    C1: require('../../../../../assets/vocabulary/italian_C1.txt'),
  },
  portuguese: {
    A1: require('../../../../../assets/vocabulary/portuguese_A1.txt'),
    A2: require('../../../../../assets/vocabulary/portuguese_A2.txt'),
    B1: require('../../../../../assets/vocabulary/portuguese_B1.txt'),
    B2: require('../../../../../assets/vocabulary/portuguese_B2.txt'),
    C1: require('../../../../../assets/vocabulary/portuguese_C1.txt'),
  },
  russian: {
    A1: require('../../../../../assets/vocabulary/russian_A1.txt'),
    A2: require('../../../../../assets/vocabulary/russian_A2.txt'),
    B1: require('../../../../../assets/vocabulary/russian_B1.txt'),
    B2: require('../../../../../assets/vocabulary/russian_B2.txt'),
    C1: require('../../../../../assets/vocabulary/russian_C1.txt'),
  },
  japanese: {
    A1: require('../../../../../assets/vocabulary/japanese_A1.txt'),
    A2: require('../../../../../assets/vocabulary/japanese_A2.txt'),
    B1: require('../../../../../assets/vocabulary/japanese_B1.txt'),
    B2: require('../../../../../assets/vocabulary/japanese_B2.txt'),
    C1: require('../../../../../assets/vocabulary/japanese_C1.txt'),
  },
  korean: {
    A1: require('../../../../../assets/vocabulary/korean_A1.txt'),
    A2: require('../../../../../assets/vocabulary/korean_A2.txt'),
    B1: require('../../../../../assets/vocabulary/korean_B1.txt'),
    B2: require('../../../../../assets/vocabulary/korean_B2.txt'),
    C1: require('../../../../../assets/vocabulary/korean_C1.txt'),
  },
  chinese: {
    A1: require('../../../../../assets/vocabulary/chinese_A1.txt'),
    A2: require('../../../../../assets/vocabulary/chinese_A2.txt'),
    B1: require('../../../../../assets/vocabulary/chinese_B1.txt'),
    B2: require('../../../../../assets/vocabulary/chinese_B2.txt'),
    C1: require('../../../../../assets/vocabulary/chinese_C1.txt'),
  },
  arabic: {
    A1: require('../../../../../assets/vocabulary/arabic_A1.txt'),
    A2: require('../../../../../assets/vocabulary/arabic_A2.txt'),
    B1: require('../../../../../assets/vocabulary/arabic_B1.txt'),
    B2: require('../../../../../assets/vocabulary/arabic_B2.txt'),
    C1: require('../../../../../assets/vocabulary/arabic_C1.txt'),
  },
  hindi: {
    A1: require('../../../../../assets/vocabulary/hindi_A1.txt'),
    A2: require('../../../../../assets/vocabulary/hindi_A2.txt'),
    B1: require('../../../../../assets/vocabulary/hindi_B1.txt'),
    B2: require('../../../../../assets/vocabulary/hindi_B2.txt'),
    C1: require('../../../../../assets/vocabulary/hindi_C1.txt'),
  },
  indonesian: {
    A1: require('../../../../../assets/vocabulary/indonesian_A1.txt'),
    A2: require('../../../../../assets/vocabulary/indonesian_A2.txt'),
    B1: require('../../../../../assets/vocabulary/indonesian_B1.txt'),
    B2: require('../../../../../assets/vocabulary/indonesian_B2.txt'),
    C1: require('../../../../../assets/vocabulary/indonesian_C1.txt'),
  },
  persian: {
    A1: require('../../../../../assets/vocabulary/persian_A1.txt'),
    A2: require('../../../../../assets/vocabulary/persian_A2.txt'),
    B1: require('../../../../../assets/vocabulary/persian_B1.txt'),
    B2: require('../../../../../assets/vocabulary/persian_B2.txt'),
    C1: require('../../../../../assets/vocabulary/persian_C1.txt'),
  },
  serbian: {
    A1: require('../../../../../assets/vocabulary/serbian_A1.txt'),
    A2: require('../../../../../assets/vocabulary/serbian_A2.txt'),
    B1: require('../../../../../assets/vocabulary/serbian_B1.txt'),
    B2: require('../../../../../assets/vocabulary/serbian_B2.txt'),
    C1: require('../../../../../assets/vocabulary/serbian_C1.txt'),
  },
  swahili: {
    A1: require('../../../../../assets/vocabulary/swahili_A1.txt'),
    A2: require('../../../../../assets/vocabulary/swahili_A2.txt'),
    B1: require('../../../../../assets/vocabulary/swahili_B1.txt'),
    B2: require('../../../../../assets/vocabulary/swahili_B2.txt'),
    C1: require('../../../../../assets/vocabulary/swahili_C1.txt'),
  },
  thai: {
    A1: require('../../../../../assets/vocabulary/thai_A1.txt'),
    A2: require('../../../../../assets/vocabulary/thai_A2.txt'),
    B1: require('../../../../../assets/vocabulary/thai_B1.txt'),
    B2: require('../../../../../assets/vocabulary/thai_B2.txt'),
    C1: require('../../../../../assets/vocabulary/thai_C1.txt'),
  },
  urdu: {
    A1: require('../../../../../assets/vocabulary/urdu_A1.txt'),
    A2: require('../../../../../assets/vocabulary/urdu_A2.txt'),
    B1: require('../../../../../assets/vocabulary/urdu_B1.txt'),
    B2: require('../../../../../assets/vocabulary/urdu_B2.txt'),
    C1: require('../../../../../assets/vocabulary/urdu_C1.txt'),
  },
  vietnamese: {
    A1: require('../../../../../assets/vocabulary/vietnamese_A1.txt'),
    A2: require('../../../../../assets/vocabulary/vietnamese_A2.txt'),
    B1: require('../../../../../assets/vocabulary/vietnamese_B1.txt'),
    B2: require('../../../../../assets/vocabulary/vietnamese_B2.txt'),
    C1: require('../../../../../assets/vocabulary/vietnamese_C1.txt'),
  },
  amharic: {
    A1: require('../../../../../assets/vocabulary/amharic_A1.txt'),
    A2: require('../../../../../assets/vocabulary/amharic_A2.txt'),
    B1: require('../../../../../assets/vocabulary/amharic_B1.txt'),
    B2: require('../../../../../assets/vocabulary/amharic_B2.txt'),
    C1: require('../../../../../assets/vocabulary/amharic_C1.txt'),
  },
};

const assetCache = new Map<string, VocabularyWord[]>();
const levelKey = (level: Level) => `${STORAGE_KEYS.VOCABULARY_LEVEL_PREFIX}${level}`;

export class AssetVocabularyRepository implements VocabularyRepository {
  async loadAssetWords(language: string, level: Level): Promise<VocabularyWord[] | null> {
    const cacheKey = `${language}_${level}`;
    const cached = assetCache.get(cacheKey);
    if (cached) return cached;
    const moduleId = VOCABULARY_ASSETS[language]?.[level];
    if (!moduleId) return null;
    const asset = Asset.fromModule(moduleId);
    await asset.downloadAsync();
    const raw = await FileSystem.readAsStringAsync(asset.localUri ?? asset.uri);
    const parsed = JSON.parse(raw) as { words?: VocabularyWord[] };
    if (!Array.isArray(parsed.words)) return null;
    assetCache.set(cacheKey, parsed.words);
    return parsed.words;
  }

  getSchemaVersion(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.VOCABULARY_SCHEMA_VERSION);
  }

  async setSchemaVersion(version: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.VOCABULARY_SCHEMA_VERSION, String(version));
  }

  async hasStoredVocabulary(): Promise<boolean> {
    for (const level of LEVELS) {
      if ((await AsyncStorage.getItem(levelKey(level))) !== null) return true;
    }
    return (await AsyncStorage.getItem(STORAGE_KEYS.VOCABULARY)) !== null;
  }

  async getLanguagePair(): Promise<{ native: string; target: string } | null> {
    const native = await AsyncStorage.getItem(STORAGE_KEYS.NATIVE_LANGUAGE);
    const target = await AsyncStorage.getItem(STORAGE_KEYS.TARGET_LANGUAGE);
    return native && target ? { native, target } : null;
  }

  async setLanguagePair(nativeLanguage: string, targetLanguage: string): Promise<void> {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.NATIVE_LANGUAGE, nativeLanguage],
      [STORAGE_KEYS.TARGET_LANGUAGE, targetLanguage],
    ]);
  }

  async getLevelWords(level: Level): Promise<VocabularyWord[] | null> {
    const raw = await AsyncStorage.getItem(levelKey(level));
    return raw ? (JSON.parse(raw) as VocabularyWord[]) : null;
  }

  async getLegacyVocabulary(): Promise<StoredVocabularyByLevel | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.VOCABULARY);
    return raw ? (JSON.parse(raw) as StoredVocabularyByLevel) : null;
  }

  async writeLevelWords(entries: StoredVocabularyByLevel): Promise<void> {
    const pairs = Object.entries(entries).map(
      ([level, words]) => [levelKey(level as Level), JSON.stringify(words)] as [string, string],
    );
    if (pairs.length > 0) await AsyncStorage.multiSet(pairs);
  }

  async removeLegacyVocabulary(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.VOCABULARY);
  }

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.VOCABULARY,
      ...LEVELS.map(levelKey),
      STORAGE_KEYS.VOCABULARY_SCHEMA_VERSION,
      STORAGE_KEYS.NATIVE_LANGUAGE,
      STORAGE_KEYS.TARGET_LANGUAGE,
    ]);
    assetCache.clear();
  }
}
