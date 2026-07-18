// src/features/vocabulary/data/contracts.ts
// Layer: data (contracts) | Feature: vocabulary. Interface only (docs/refactor-v2/35 §4).
// Local-first: words come from assets/vocabulary/*.txt + AsyncStorage cache — NEVER Firestore.

import type { Level, VocabularyWord } from '../domain/types';

export type StoredVocabularyByLevel = Partial<Record<Level, VocabularyWord[]>>;

export interface VocabularyRepository {
  loadAssetWords(language: string, level: Level): Promise<VocabularyWord[] | null>;
  getSchemaVersion(): Promise<string | null>;
  setSchemaVersion(version: number): Promise<void>;
  hasStoredVocabulary(): Promise<boolean>;
  getLanguagePair(): Promise<{ native: string; target: string } | null>;
  setLanguagePair(nativeLanguage: string, targetLanguage: string): Promise<void>;
  getLevelWords(level: Level): Promise<VocabularyWord[] | null>;
  getLegacyVocabulary(): Promise<StoredVocabularyByLevel | null>;
  writeLevelWords(entries: StoredVocabularyByLevel): Promise<void>;
  removeLegacyVocabulary(): Promise<void>;
  clear(): Promise<void>;
}
