// src/features/progress/data/contracts.ts
// Layer: data (contracts) | Feature: progress. Interfaces only (domain types in/out — no DTO leakage).
// application/presentation depend ONLY on these interfaces (DIP — docs/architecture.md).

import type { Level, LevelProgress, ProgressSummary } from '../domain/types';
import type { LegacyProgressDoc } from './dto';

/** Remote (Firestore) progress access with v2 progressByLevel + legacy dual-read (docs/architecture.md). */
export interface RemoteProgressRepository {
  getProgressSummary(userId: string): Promise<ProgressSummary>;
  /** Dual-read: progressByLevel/{level} first, else adapt legacy progress.learnedWords[level]. */
  getProgressByLevel(userId: string, level: Level): Promise<LevelProgress | null>;
  /** Writes the v2 subcollection doc. Legacy field is NEVER deleted here (cleanup is Phase 9). */
  saveProgressByLevel(userId: string, progress: LevelProgress): Promise<void>;
  /** Legacy fallback source (users/{uid}.progress). */
  getLegacyProgressFallback(userId: string): Promise<LegacyProgressDoc | null>;
}

/** Local-first mirror (AsyncStorage) — preserves existing services/progressService.ts behavior. */
export interface LocalProgressRepository {
  getLocalLearnedWords(level: Level): Promise<number[]>;
  markWordLearnedLocal(level: Level, wordId: number): Promise<void>;
  setLastWordId(wordId: number): Promise<void>;
  getLastWordId(): Promise<number | null>;
}

/** Composite repository (docs/architecture.md). Implementations are split (Firestore + Local). */
export type ProgressRepository = RemoteProgressRepository & LocalProgressRepository;
