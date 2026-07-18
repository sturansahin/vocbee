import type { Level, UserProgress } from '../domain/types';

export interface ProgressLocalStore {
  readProgress(): Promise<UserProgress>;
  writeProgress(progress: UserProgress): Promise<void>;
  readCurrentLevel(): Promise<string | null>;
  writeCurrentLevel(level: string): Promise<void>;
  readLastWordId(): Promise<string | null>;
  writeLastWordId(wordId: number): Promise<void>;
  clear(markUnsynced: boolean): Promise<void>;
  restore(
    progress: UserProgress | null,
    currentLevel: string | null,
    lastWordId?: number | null,
  ): Promise<void>;
}

export interface ProgressVocabularySource {
  getStoredWordIds(level: Level): Promise<number[]>;
}
