import type { Level, VocabularyWord } from '@features/vocabulary';

import type {
  DetectedLevel,
  LevelTestLanguageSelection,
  LevelTestQuestion,
} from '../domain/levelTestTypes';

export interface LevelTestPreferencesRepository {
  getStoredLanguages(): Promise<Required<LevelTestLanguageSelection> | null>;
}

export interface LevelTestVocabularySource {
  getWords(nativeLanguage: string, targetLanguage: string, level: Level): Promise<VocabularyWord[]>;
}

export interface LevelTestFacade {
  loadQuestions(routeLanguages?: LevelTestLanguageSelection): Promise<LevelTestQuestion[]>;
  detectLevel(correctAnswers: number, totalQuestions: number): DetectedLevel;
}
