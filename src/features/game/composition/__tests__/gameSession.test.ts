import { AccessibilityInfo, Appearance } from 'react-native';
import type { VocabularyWord } from '@features/vocabulary';

import { buildGameSession } from '../../domain/gameSession';
import { prepareGameSession, prepareGameSessionJson } from '../gameSession';

const mockGetLearnedWords = jest.fn();
const mockGetStoredVocabulary = jest.fn();

jest.mock('expo-crypto', () => ({ randomUUID: () => 'session-1' }));
jest.mock('@features/progress', () => ({
  getCurrentLevel: async () => 'A1',
  getLearnedWords: (...args: unknown[]) => mockGetLearnedWords(...args),
}));
jest.mock('@features/vocabulary', () => ({
  VOCABULARY_SCHEMA_VERSION: 2,
  getLanguagePair: async () => ({ native: 'turkish', target: 'english' }),
  getStoredVocabulary: (...args: unknown[]) => mockGetStoredVocabulary(...args),
  isLevel: (value: unknown) => value === 'A1',
  shuffleArray: <T>(values: T[]) => [...values],
}));
jest.mock('../../../../../modules/vocbee-unity', () => ({ openGame: jest.fn() }));

function word(id: number, padded = false): VocabularyWord {
  const suffix = `-${id}`;
  const label = (prefix: string) =>
    padded
      ? `${prefix}${'ı'.repeat(80 - prefix.length - suffix.length)}${suffix}`
      : `${prefix}${suffix}`;

  return {
    id,
    word: label('target'),
    translation: label('prompt'),
    sentence1: '',
    sentence2: '',
    nativeSentence1: '',
    nativeSentence2: '',
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetLearnedWords.mockResolvedValue([]);
  mockGetStoredVocabulary.mockResolvedValue([]);
});

it('passes the platform accessibility and theme preferences into the game session', async () => {
  const vocabulary = Array.from({ length: 15 }, (_, index) => word(index + 1));
  mockGetStoredVocabulary.mockResolvedValueOnce(vocabulary);
  mockGetLearnedWords.mockResolvedValueOnce(vocabulary.map(({ id }) => id));
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValueOnce(true);
  jest.spyOn(Appearance, 'getColorScheme').mockReturnValueOnce('dark');

  const session = await prepareGameSession();

  expect(session).toMatchObject({
    reducedMotion: true,
    theme: 'dark',
  });
  expect(session.rounds).toHaveLength(15);
});

it('keeps the largest shuffled round prefix that fits the 64 KiB bridge limit', async () => {
  const vocabulary = Array.from({ length: 300 }, (_, index) => word(index + 1, true));
  const learnedWordIds = vocabulary.map(({ id }) => id);
  mockGetStoredVocabulary.mockResolvedValueOnce(vocabulary);
  mockGetLearnedWords.mockResolvedValueOnce(learnedWordIds);
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValueOnce(false);
  jest.spyOn(Appearance, 'getColorScheme').mockReturnValueOnce('light');

  const sessionJson = await prepareGameSessionJson();
  const session = JSON.parse(sessionJson);
  const fullSession = buildGameSession({
    sessionId: 'session-1',
    level: 'A1',
    nativeLanguage: 'turkish',
    targetLanguage: 'english',
    vocabulary,
    learnedWordIds,
    random: () => 0,
  });

  expect(session.rounds.length).toBeGreaterThanOrEqual(3);
  expect(session.rounds.length).toBeLessThan(fullSession.rounds.length);
  expect(session.rounds).toEqual(fullSession.rounds.slice(0, session.rounds.length));
  expect(Buffer.byteLength(sessionJson, 'utf8')).toBeLessThanOrEqual(64 * 1024);
  expect(
    Buffer.byteLength(
      JSON.stringify({
        ...session,
        rounds: fullSession.rounds.slice(0, session.rounds.length + 1),
      }),
      'utf8',
    ),
  ).toBeGreaterThan(64 * 1024);
});
