import type { Level, VocabularyWord } from '@features/vocabulary';

import type { DetectedLevel, LevelTestQuestion } from './levelTestTypes';

export const LEVEL_TEST_QUESTION_PLAN: ReadonlyArray<{ level: Level; count: number }> = [
  { level: 'A1', count: 1 },
  { level: 'A2', count: 1 },
  { level: 'B1', count: 1 },
  { level: 'B2', count: 2 },
  { level: 'C1', count: 2 },
];

export function shuffleLevelTestItems<T>(items: readonly T[], random = Math.random): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[nextIndex]] = [shuffled[nextIndex], shuffled[index]];
  }
  return shuffled;
}

export function buildLevelTestQuestions(
  vocabulary: VocabularyWord[],
  level: Level,
  count: number,
  firstQuestionId: number,
  random = Math.random,
): LevelTestQuestion[] {
  if (vocabulary.length < 4) return [];

  return shuffleLevelTestItems(vocabulary, random)
    .slice(0, count)
    .map((word, offset) => {
      const distractors = shuffleLevelTestItems(
        vocabulary.filter((candidate) => candidate.id !== word.id),
        random,
      )
        .slice(0, 3)
        .map((candidate) => candidate.translation);

      return {
        id: firstQuestionId + offset,
        word: word.word,
        correct: word.translation,
        options: shuffleLevelTestItems([word.translation, ...distractors], random),
        level,
      };
    });
}

export function detectLevelFromScore(
  correctAnswers: number,
  totalQuestions: number,
): DetectedLevel {
  const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  if (percentage >= 80) return 'advanced';
  if (percentage >= 50) return 'intermediate';
  return 'beginner';
}
