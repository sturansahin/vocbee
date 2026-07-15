import { buildLevelTestQuestions, detectLevelFromScore } from '../levelTestRules';
import type { VocabularyWord } from '@features/vocabulary';

const words: VocabularyWord[] = [1, 2, 3, 4].map(id => ({
  id,
  word: `word-${id}`,
  translation: `translation-${id}`,
  sentence1: '',
  sentence2: '',
  nativeSentence1: '',
  nativeSentence2: '',
}));

describe('level test rules', () => {
  it('preserves the percentage-based level thresholds', () => {
    expect(detectLevelFromScore(0, 7)).toBe('beginner');
    expect(detectLevelFromScore(4, 7)).toBe('intermediate');
    expect(detectLevelFromScore(6, 7)).toBe('advanced');
  });

  it('builds a question with one correct answer and three distractors', () => {
    const [question] = buildLevelTestQuestions(words, 'A1', 1, 10, () => 0);
    expect(question.id).toBe(10);
    expect(question.options).toHaveLength(4);
    expect(question.options).toContain(question.correct);
    expect(new Set(question.options).size).toBe(4);
  });
});
