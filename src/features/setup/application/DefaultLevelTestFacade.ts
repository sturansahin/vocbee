import {
  buildLevelTestQuestions,
  detectLevelFromScore,
  LEVEL_TEST_QUESTION_PLAN,
} from '../domain/levelTestRules';
import type { LevelTestLanguageSelection, LevelTestQuestion } from '../domain/levelTestTypes';
import type {
  LevelTestFacade,
  LevelTestPreferencesRepository,
  LevelTestVocabularySource,
} from './levelTestContracts';

export class DefaultLevelTestFacade implements LevelTestFacade {
  constructor(
    private readonly preferences: LevelTestPreferencesRepository,
    private readonly vocabulary: LevelTestVocabularySource,
    private readonly random: () => number = Math.random,
  ) {}

  async loadQuestions(routeLanguages?: LevelTestLanguageSelection): Promise<LevelTestQuestion[]> {
    let nativeLanguage = routeLanguages?.nativeLanguage;
    let targetLanguage = routeLanguages?.targetLanguage;

    if (!nativeLanguage || !targetLanguage) {
      const stored = await this.preferences.getStoredLanguages();
      nativeLanguage = nativeLanguage || stored?.nativeLanguage;
      targetLanguage = targetLanguage || stored?.targetLanguage;
    }

    if (!nativeLanguage || !targetLanguage) throw new Error('Languages not set');

    const questions: LevelTestQuestion[] = [];
    for (const { level, count } of LEVEL_TEST_QUESTION_PLAN) {
      try {
        const words = await this.vocabulary.getWords(nativeLanguage, targetLanguage, level);
        const generated = buildLevelTestQuestions(
          words,
          level,
          count,
          questions.length + 1,
          this.random,
        );
        if (generated.length === 0) {
          console.warn(`Not enough words for level ${level}`);
        } else {
          questions.push(...generated);
        }
      } catch (error) {
        console.error(`Error loading vocabulary for level ${level}:`, error);
      }
    }

    if (questions.length === 0) throw new Error('No questions generated');
    return questions;
  }

  detectLevel = detectLevelFromScore;
}
