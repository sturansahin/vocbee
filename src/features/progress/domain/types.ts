// src/features/progress/domain/types.ts
// Layer: domain | Feature: progress | Pure TS (NO SDK imports — docs/refactor-v2/33, /34 §2).
// Dates are NOT represented here (no Firestore Timestamp); date/Timestamp conversion lives in data/adapters.

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

export function isLevel(value: unknown): value is Level {
  return typeof value === 'string' && (LEVELS as string[]).includes(value);
}

// Single level's progress as seen by UI / use-cases (the domain model).
export type LevelProgress = {
  level: Level;
  learnedWordIds: number[];
  lastWordIndex: number;
  learnedCount: number;
  favoriteWordIds?: number[];
};

// Per-level + overall summary kept on the main user doc so profile reads stay cheap (docs/refactor-v2/07 §3).
export type ProgressSummary = {
  byLevel: Partial<Record<Level, { learnedCount: number; totalCount: number; percent: number }>>;
  overallPercent: number;
};
