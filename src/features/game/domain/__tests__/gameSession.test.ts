import type { VocabularyWord } from '@features/vocabulary';
import { gameRunnerTranslations } from '../../../../../locales/gameRunner';

import { buildGameSession, validateGameSession } from '../gameSession';

function word(id: number): VocabularyWord {
  return {
    id,
    word: `target-${id}`,
    translation: `prompt-${id}`,
    sentence1: '',
    sentence2: '',
    nativeSentence1: '',
    nativeSentence2: '',
  };
}

it('builds separate validated new-word and review decks from the current level', () => {
  const vocabulary = Array.from({ length: 15 }, (_, index) => word(index + 1));
  const learnedWordIds = vocabulary.slice(0, 6).map(({ id }) => id);
  const session = buildGameSession({
    sessionId: 'session-1',
    level: 'A1',
    nativeLanguage: 'turkish',
    targetLanguage: 'english',
    vocabulary,
    learnedWordIds,
    uiLanguage: 'en',
    isRtl: false,
    uiText: gameRunnerTranslations.en,
    random: () => 0.5,
  });

  expect(validateGameSession(session)).toBe(true);
  expect(session.newWords.contentState).toBe('ready');
  expect(session.review.contentState).toBe('ready');
  expect(session.newWords.rounds).toHaveLength(9);
  expect(session.review.rounds).toHaveLength(6);
  expect(
    [...session.newWords.rounds, ...session.review.rounds].every(
      (round) =>
        round.choices.length === 3 &&
        round.choices.filter(({ wordId }) => wordId === round.correctWordId).length === 1,
    ),
  ).toBe(true);

  const differentlyShuffled = buildGameSession({
    sessionId: 'session-shuffled',
    level: 'A1',
    nativeLanguage: 'turkish',
    targetLanguage: 'english',
    vocabulary,
    learnedWordIds,
    uiLanguage: 'en',
    isRtl: false,
    uiText: gameRunnerTranslations.en,
    random: () => 0,
  });
  expect(differentlyShuffled.newWords.rounds.map(({ wordId }) => wordId)).not.toEqual(
    session.newWords.rounds.map(({ wordId }) => wordId),
  );

  const placeholder = buildGameSession({
    sessionId: 'session-2',
    level: 'A1',
    vocabulary,
    learnedWordIds: [],
    uiLanguage: 'en',
    isRtl: false,
    uiText: gameRunnerTranslations.en,
  });
  expect(placeholder.newWords.contentState).toBe('placeholder');
  expect(placeholder.review.contentState).toBe('placeholder');
  expect(placeholder.newWords.rounds).toEqual([]);
  expect(placeholder.review.rounds).toEqual([]);
  expect(validateGameSession(placeholder)).toBe(true);
});

it('caps each mode independently without mixing learned and unlearned choices', () => {
  const vocabulary = Array.from({ length: 60 }, (_, index) => word(index + 1));
  const learnedWordIds = vocabulary.slice(0, 30).map(({ id }) => id);
  const learnedIds = new Set(learnedWordIds);
  const session = buildGameSession({
    sessionId: 'session-limits',
    level: 'A1',
    nativeLanguage: 'turkish',
    targetLanguage: 'english',
    vocabulary,
    learnedWordIds,
    newWordRoundLimit: 10,
    reviewRoundLimit: 12,
    uiLanguage: 'en',
    isRtl: false,
    uiText: gameRunnerTranslations.en,
    random: () => 0.5,
  });

  expect(session.newWords.rounds).toHaveLength(10);
  expect(session.review.rounds).toHaveLength(12);
  expect(
    session.newWords.rounds.every((round) =>
      round.choices.every(({ wordId }) => !learnedIds.has(wordId)),
    ),
  ).toBe(true);
  expect(
    session.review.rounds.every((round) =>
      round.choices.every(({ wordId }) => learnedIds.has(wordId)),
    ),
  ).toBe(true);
});
