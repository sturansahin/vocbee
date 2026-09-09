import { gameRunnerTranslations } from '../../../../../locales/gameRunner';
import fixture from '../../../../../docs/artifacts/game-session-v4.fixture.json';

import {
  buildGameSession,
  GAME_CATALOG_HASH,
  getGameSessionValidationError,
  validateGameSession,
} from '../gameSession';

const input = {
  sessionId: '123e4567-e89b-42d3-a456-426614174000',
  level: 'A1' as const,
  nativeLanguage: 'turkish',
  targetLanguage: 'english',
  learnedWordIds: [42, 1],
  uiLanguage: 'en',
  isRtl: false,
  uiText: gameRunnerTranslations.en,
};

it('builds a validated V4 metadata snapshot without vocabulary or rounds', () => {
  const session = buildGameSession(input);

  expect(session).toMatchObject({
    schemaVersion: 4,
    bridgeVersion: 1,
    vocabularySchemaVersion: 2,
    catalogVersion: 1,
    catalogHash: GAME_CATALOG_HASH,
    nativeLanguage: 'turkish',
    targetLanguage: 'english',
    learnedWordIds: [1, 42],
  });
  expect(validateGameSession(session)).toBe(true);
  for (const field of ['newWords', 'review', 'rounds', 'prompt', 'choices', 'correctWordId']) {
    expect(session).not.toHaveProperty(field);
  }
});

it('accepts the canonical fixture and rejects invalid metadata and IDs explicitly', () => {
  expect(validateGameSession(fixture)).toBe(true);

  const cases: [unknown, string][] = [
    [{ ...fixture, sessionId: 'not-a-uuid' }, 'INVALID_SESSION_ID'],
    [{ ...fixture, catalogHash: 'A'.repeat(64) }, 'INVALID_CATALOG_METADATA'],
    [{ ...fixture, catalogHash: '0'.repeat(64) }, 'CATALOG_MISMATCH'],
    [{ ...fixture, nativeLanguage: 'unknown' }, 'UNSUPPORTED_LANGUAGE'],
    [{ ...fixture, nativeLanguage: 'english' }, 'SAME_LANGUAGE_PAIR'],
    [{ ...fixture, learnedWordIds: [1, 1] }, 'INVALID_LEARNED_WORD_IDS'],
    [{ ...fixture, learnedWordIds: [-1] }, 'INVALID_LEARNED_WORD_IDS'],
    [{ ...fixture, learnedWordIds: [Number.MAX_SAFE_INTEGER + 1] }, 'INVALID_LEARNED_WORD_IDS'],
    [{ ...fixture, learnedWordIds: [899] }, 'UNKNOWN_LEARNED_WORD_ID'],
    [{ ...fixture, rounds: [] }, 'UNKNOWN_FIELD'],
  ];
  for (const [value, error] of cases) {
    expect(getGameSessionValidationError(value)).toBe(error);
    expect(validateGameSession(value)).toBe(false);
  }
  expect(() => buildGameSession({ ...input, learnedWordIds: [899] })).toThrow(
    'UNKNOWN_LEARNED_WORD_ID',
  );
});
