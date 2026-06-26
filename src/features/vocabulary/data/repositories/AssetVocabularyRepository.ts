// src/features/vocabulary/data/repositories/AssetVocabularyRepository.ts
// Layer: data (repository impl) | Feature: vocabulary.
//
// ⚠️ PREP / NOT WIRED (Phase 5, docs/refactor-v2/25, /35 §4): not imported by running code, not exported
//    from the barrel (docs/refactor-v2/33 §4). Wraps the existing (tested) services/vocabularyService so the
//    local-first vocabulary access can be consumed via an interface when HomeScreen is decomposed later.
//    Firestore is NEVER touched — the 5500+ words stay in assets/vocabulary/*.txt (binding, docs/refactor-v2/07).

import {
  getStoredVocabulary,
  isVocabularyGenerated,
  generateVocabulary,
  clearVocabulary,
} from '../../../../../services/vocabularyService';
import type { Level, VocabularyWord } from '../../domain/types';
import type { VocabularyRepository } from '../contracts';

export class AssetVocabularyRepository implements VocabularyRepository {
  async getWords(level: Level): Promise<VocabularyWord[]> {
    return getStoredVocabulary(level);
  }

  async getTotalCount(level: Level): Promise<number> {
    const words = await getStoredVocabulary(level);
    return words.length;
  }

  async isGenerated(): Promise<boolean> {
    return isVocabularyGenerated();
  }

  async generate(nativeLanguage: string, targetLanguage: string): Promise<void> {
    return generateVocabulary(nativeLanguage, targetLanguage);
  }

  async clear(): Promise<void> {
    return clearVocabulary();
  }
}
