import { LEVELS, type Level, type UserLevel, type VocabularyWord } from './types';

export function isUserLevel(value: unknown): value is UserLevel {
  return value === 'beginner' || value === 'intermediate' || value === 'advanced';
}

export function getUserLevelFromCefrLevel(level: string | null | undefined): UserLevel {
  if (level === 'A1' || level === 'A2') return 'beginner';
  if (level === 'B1' || level === 'B2') return 'intermediate';
  if (level === 'C1') return 'advanced';
  return 'beginner';
}

export function getLevelsForUserLevel(userLevel: string): Level[] {
  if (userLevel === 'intermediate') return ['B1', 'B2'];
  if (userLevel === 'advanced') return ['C1'];
  return ['A1', 'A2'];
}

export function getFirstLevelForUserLevel(userLevel: string): Level {
  return getLevelsForUserLevel(userLevel)[0];
}

export function normalizePronunciation(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function mergeVocabularyWords(
  targetWords: VocabularyWord[] | null,
  nativeWords: VocabularyWord[] | null,
): VocabularyWord[] {
  if (!targetWords) return [];
  if (!nativeWords) {
    return targetWords.map((word) => ({
      ...word,
      pronunciation: normalizePronunciation(word.pronunciation),
      translation: word.word,
      nativeSentence1: word.sentence1,
      nativeSentence2: word.sentence2,
    }));
  }

  const nativeById = new Map(nativeWords.map((word) => [word.id, word]));
  return targetWords.map((targetWord) => {
    const nativeWord = nativeById.get(targetWord.id);
    return {
      id: targetWord.id,
      word: targetWord.word,
      pronunciation: normalizePronunciation(targetWord.pronunciation),
      translation: nativeWord ? nativeWord.word : targetWord.word,
      sentence1: targetWord.sentence1,
      sentence2: targetWord.sentence2,
      nativeSentence1: nativeWord ? nativeWord.sentence1 : targetWord.sentence1,
      nativeSentence2: nativeWord ? nativeWord.sentence2 : targetWord.sentence2,
    };
  });
}

export function shuffleArray<T>(array: T[], random: () => number = Math.random): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function isLevel(value: unknown): value is Level {
  return typeof value === 'string' && LEVELS.includes(value as Level);
}
