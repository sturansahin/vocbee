import type { Level } from '@features/vocabulary';

export type DetectedLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LevelTestQuestion {
  id: number;
  word: string;
  correct: string;
  options: string[];
  level: Level;
}

export interface LevelTestLanguageSelection {
  nativeLanguage?: string;
  targetLanguage?: string;
}
