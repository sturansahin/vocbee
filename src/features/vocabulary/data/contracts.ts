// src/features/vocabulary/data/contracts.ts
// Layer: data (contracts) | Feature: vocabulary. Interface only (docs/refactor-v2/35 §4).
// Local-first: words come from assets/vocabulary/*.txt + AsyncStorage cache — NEVER Firestore.

import type { Level, VocabularyWord } from '../domain/types';

export interface VocabularyRepository {
  getWords(level: Level): Promise<VocabularyWord[]>;       // getStoredVocabulary
  getTotalCount(level: Level): Promise<number>;            // progress totalCount source
  isGenerated(): Promise<boolean>;                         // isVocabularyGenerated
  generate(nativeLanguage: string, targetLanguage: string): Promise<void>; // generateVocabulary
  clear(): Promise<void>;                                  // clearVocabulary
}
