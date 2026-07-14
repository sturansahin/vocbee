// src/features/vocabulary — public barrel (docs/refactor-v2/33 §4).
// Exposes domain types/constants, the pure wordAdapter, and the repository INTERFACE.
// Does NOT export AssetVocabularyRepository (impl).

export * from './domain/types';
export * from './domain/constants';
export * from './domain/rules';
export { parseVocabularyTxt } from './data/adapters/wordAdapter';
export type { VocabularyRepository } from './data/contracts';
export * from './composition/vocabularyService';
