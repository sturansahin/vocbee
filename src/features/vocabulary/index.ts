// src/features/vocabulary — public barrel (docs/architecture.md).
// Exposes domain types/constants, pure rules, and the repository INTERFACE.
// Does NOT export AssetVocabularyRepository (impl).

export * from './domain/types';
export * from './domain/constants';
export * from './domain/rules';
export type { VocabularyRepository } from './data/contracts';
export * from './composition/vocabularyService';
