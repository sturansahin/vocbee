// src/features/vocabulary/domain/types.ts
// Layer: domain | Feature: vocabulary | Pure TS (NO SDK).
// Mirrors the real shapes in services/vocabularyService.ts (binding — docs/refactor-v2/34, /35 §4).

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
export type UserLevel = 'beginner' | 'intermediate' | 'advanced';

export interface VocabularyWord {
  id: number;
  word: string;
  pronunciation?: string | null;
  translation: string;
  sentence1: string;
  sentence2: string;
  nativeSentence1: string;
  nativeSentence2: string;
}
