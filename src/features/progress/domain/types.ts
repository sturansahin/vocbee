// src/features/progress/domain/types.ts
// Layer: domain | Feature: progress | Pure TS (NO SDK imports — docs/refactor-v2/33, /34 §2).
// Dates are NOT represented here (no Firestore Timestamp); date/Timestamp conversion lives in data/adapters.

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

export interface UserProgress {
  [level: string]: number[];
}

export interface OverallProgressStats {
  totalLearned: number;
  totalWords: number;
  percentage: number;
  completedLevels: Level[];
}

export function isLevel(value: unknown): value is Level {
  return typeof value === 'string' && (LEVELS as string[]).includes(value);
}

// Single level's progress as seen by UI / use-cases (the domain model).
export type LevelProgress = {
  level: Level;
  learnedWordIds: number[];
  /** Canonical resume pointer. Legacy Firestore called this value `lastWordIndex`, but it stores a word id. */
  lastWordId: number;
  learnedCount: number;
  vocabularySchemaVersion: number;
  favoriteWordIds?: number[];
};

export type ProgressSummaryEntry = {
  learnedCount: number;
  /** Optional derived display data. The persisted source of truth remains learnedWordIds. */
  totalCount?: number;
  percent?: number;
};

// Small derived summary kept on the main user doc so profile reads stay cheap.
export type ProgressSummary = {
  byLevel: Partial<Record<Level, ProgressSummaryEntry>>;
  totalLearnedCount: number;
  overallPercent?: number;
};

export type ProgressV2WritePlan = {
  activeLevel: Level;
  levels: LevelProgress[];
  summary: ProgressSummary;
};
