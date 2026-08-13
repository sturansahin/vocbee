import type { VocabularyWord } from '@features/vocabulary';

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

it('builds a validated learned-word session and falls back to empty placeholder content', () => {
  const vocabulary = Array.from({ length: 15 }, (_, index) => word(index + 1));
  const session = buildGameSession({
    sessionId: 'session-1',
    level: 'A1',
    nativeLanguage: 'turkish',
    targetLanguage: 'english',
    vocabulary,
    learnedWordIds: vocabulary.map(({ id }) => id),
    random: () => 0.5,
  });

  expect(validateGameSession(session)).toBe(true);
  expect(session.contentState).toBe('ready');
  expect(session.rounds).toHaveLength(15);
  expect(
    session.rounds.every(
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
    learnedWordIds: vocabulary.map(({ id }) => id),
    random: () => 0,
  });
  expect(differentlyShuffled.rounds.map(({ wordId }) => wordId)).not.toEqual(
    session.rounds.map(({ wordId }) => wordId),
  );

  const placeholder = buildGameSession({
    sessionId: 'session-2',
    level: 'A1',
    vocabulary,
    learnedWordIds: [],
  });
  expect(placeholder.contentState).toBe('placeholder');
  expect(placeholder.rounds).toEqual([]);
  expect(validateGameSession(placeholder)).toBe(true);
});
